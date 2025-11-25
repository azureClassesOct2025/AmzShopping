namespace IdentityService.Models;

public sealed record UserAccount(
    string Id,
    string Email,
    string FullName,
    string PasswordHash,
    string Tier,
    int LoyaltyPoints);

