using Microsoft.EntityFrameworkCore;
using GymOS.Api.Models;

namespace GymOS.Api.Data;

public class GymDbContext(DbContextOptions<GymDbContext> options) : DbContext(options)
{
    public DbSet<Gym> Gyms => Set<Gym>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Map to same tables as Prisma (lowercase snake_case)
        b.Entity<Gym>().ToTable("Gym");
        b.Entity<User>().ToTable("User")
            .HasIndex(u => new { u.GymId, u.Email }).IsUnique();
        b.Entity<RefreshToken>().ToTable("RefreshToken")
            .HasIndex(r => r.Token).IsUnique();
        b.Entity<Membership>().ToTable("Membership");
        b.Entity<Attendance>().ToTable("Attendance");

        b.Entity<User>()
            .HasOne(u => u.Gym).WithMany(g => g.Users).HasForeignKey(u => u.GymId);
        b.Entity<User>()
            .HasMany(u => u.RefreshTokens).WithOne(r => r.User).HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        b.Entity<Membership>()
            .HasOne(m => m.User).WithMany(u => u.Memberships).HasForeignKey(m => m.UserId);
        b.Entity<Attendance>()
            .HasOne(a => a.User).WithMany(u => u.Attendances).HasForeignKey(a => a.UserId);
    }
}
