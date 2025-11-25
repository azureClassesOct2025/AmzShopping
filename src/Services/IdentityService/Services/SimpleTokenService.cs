using System.Security.Cryptography;
using System.Text;
using IdentityService.Models;

namespace IdentityService.Services;

public sealed class SimpleTokenService : ITokenService
{
    public string IssueToken(UserAccount account)
    {
        var payload = $"{account.Id}:{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}:{RandomNumberGenerator.GetHexString(16)}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(payload));
    }
}

