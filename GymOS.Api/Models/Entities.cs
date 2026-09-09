namespace GymOS.Api.Models;

public class Gym
{
    public int Id { get; set; }
    public string GymCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Logo { get; set; }
    public string AccentColor { get; set; } = "#6366f1";
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}

public class User
{
    public int Id { get; set; }
    public int GymId { get; set; }
    public string Email { get; set; } = "";
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "MEMBER";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Phone { get; set; }
    public string? QrCode { get; set; }
    public bool IsActive { get; set; } = true;
    public int LoyaltyPoints { get; set; } = 0;
    // Security: login lockout
    public int LoginAttempts { get; set; } = 0;
    public DateTime? LockedUntil { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Gym Gym { get; set; } = null!;
    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class Membership
{
    public int Id { get; set; }
    public int GymId { get; set; }
    public int UserId { get; set; }
    public string PlanName { get; set; } = "";
    public decimal Price { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Gym Gym { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class Attendance
{
    public int Id { get; set; }
    public int GymId { get; set; }
    public int UserId { get; set; }
    public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    public DateTime? CheckOutTime { get; set; }
    public string Method { get; set; } = "MANUAL";

    public Gym Gym { get; set; } = null!;
    public User User { get; set; } = null!;
}
