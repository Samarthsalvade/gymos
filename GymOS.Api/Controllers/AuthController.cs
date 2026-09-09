using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymOS.Api.Data;
using GymOS.Api.Models;
using BC = BCrypt.Net.BCrypt;

namespace GymOS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(GymDbContext db, IConfiguration config) : ControllerBase
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(2);

    public record LoginRequest(string GymCode, string Email, string Password);
    public record RefreshRequest(string RefreshToken);
    public record LogoutRequest(string? RefreshToken);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var gym = await db.Gyms.FirstOrDefaultAsync(g => g.GymCode == req.GymCode.ToUpper());
        if (gym is null) return Unauthorized(new { error = "Invalid gym code" });

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.GymId == gym.Id && u.Email == req.Email.ToLower() && u.IsActive);
        if (user is null) return Unauthorized(new { error = "Invalid credentials" });

        // Lockout check
        if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
        {
            var secsLeft = (int)(user.LockedUntil.Value - DateTime.UtcNow).TotalSeconds;
            return StatusCode(429, new { error = $"Account locked. Try again in {secsLeft}s.", lockedUntil = user.LockedUntil });
        }

        if (!BC.Verify(req.Password, user.PasswordHash))
        {
            user.LoginAttempts++;
            if (user.LoginAttempts >= MaxAttempts)
                user.LockedUntil = DateTime.UtcNow.Add(LockoutDuration);
            await db.SaveChangesAsync();
            var remaining = MaxAttempts - user.LoginAttempts;
            return Unauthorized(new { error = user.LockedUntil.HasValue
                ? "Too many attempts. Account locked for 2 minutes."
                : $"Invalid credentials. {remaining} attempt(s) remaining." });
        }

        // Reset on success
        user.LoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;

        var access = CreateAccessToken(user, gym);
        var (refresh, expiry) = CreateRefreshToken(user, gym);
        db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, Token = refresh, ExpiresAt = expiry });
        await db.SaveChangesAsync();

        return Ok(new {
            tokens = new { access, refresh },
            user = BuildUserPayload(user, gym)
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
    {
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == req.RefreshToken);
        if (stored is null || stored.Revoked || stored.ExpiresAt < DateTime.UtcNow)
            return Unauthorized(new { error = "Refresh token invalid or expired" });

        var payload = ValidateRefreshToken(req.RefreshToken);
        if (payload is null) return Unauthorized(new { error = "Invalid refresh token" });

        stored.Revoked = true;
        var user = await db.Users.Include(u => u.Gym).FirstOrDefaultAsync(u => u.Id == stored.UserId);
        if (user is null) return Unauthorized();

        var access = CreateAccessToken(user, user.Gym);
        var (refresh, expiry) = CreateRefreshToken(user, user.Gym);
        db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, Token = refresh, ExpiresAt = expiry });
        await db.SaveChangesAsync();

        return Ok(new { tokens = new { access, refresh } });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest req)
    {
        if (!string.IsNullOrEmpty(req.RefreshToken))
        {
            var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == req.RefreshToken);
            if (stored is not null) { stored.Revoked = true; await db.SaveChangesAsync(); }
        }
        return Ok(new { message = "Logged out" });
    }

    // ── JWT helpers ───────────────────────────────────────────────────────
    private string CreateAccessToken(User user, Gym gym)
    {
        var secret = config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim("gymId", gym.Id.ToString()),
            new Claim("role", user.Role),
        };
        var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private (string token, DateTime expiry) CreateRefreshToken(User user, Gym gym)
    {
        var secret = config["Jwt:RefreshSecret"] ?? throw new InvalidOperationException("Jwt:RefreshSecret not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddDays(7);
        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim("gymId", gym.Id.ToString()),
            new Claim("role", user.Role),
        };
        var token = new JwtSecurityToken(claims: claims, expires: expiry, signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(token), expiry);
    }

    private ClaimsPrincipal? ValidateRefreshToken(string token)
    {
        var secret = config["Jwt:RefreshSecret"] ?? "";
        try
        {
            var handler = new JwtSecurityTokenHandler();
            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero,
            }, out _);
        }
        catch { return null; }
    }

    private static object BuildUserPayload(User user, Gym gym) => new
    {
        id = user.Id,
        email = user.Email,
        firstName = user.FirstName,
        lastName = user.LastName,
        role = user.Role,
        gymId = gym.Id,
        gymCode = gym.GymCode,
        gymName = gym.Name,
        gymLogo = gym.Logo,
        accentColor = gym.AccentColor,
        qrCode = user.QrCode,
        loyaltyPoints = user.LoyaltyPoints,
    };
}
