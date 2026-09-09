using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GymOS.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// ── PostgreSQL (shares the same DB with Node.js backend) ─────────────────────
builder.Services.AddDbContext<GymDbContext>(opt =>
    opt.UseNpgsql("Host=localhost;Database=gymos;Username=gymos_user;Password=gymos_secure_2024"));

// ── JWT Authentication (same secret as Node.js backend) ──────────────────────
var jwtSecret = "gym-saas-super-secret-jwt-key-change-in-production-2024";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
    });

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173", "http://localhost:8080")
     .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "GymOS .NET API", Version = "v1",
        Description = "Enterprise .NET 10 backend — shares PostgreSQL with Node.js API" }));

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "GymOS .NET API v1"));
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => new { status = "ok", runtime = ".NET 10", db = "PostgreSQL" });
app.MapControllers();

Console.WriteLine("🏋️  GymOS .NET API started");
Console.WriteLine("🐘 Database: PostgreSQL (shared with Node.js)");
Console.WriteLine("📖 Swagger: http://localhost:5000/swagger");

app.Run();
