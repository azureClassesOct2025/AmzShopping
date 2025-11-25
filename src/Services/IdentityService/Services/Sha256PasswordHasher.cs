using System.Security.Cryptography;
using System.Text;

namespace IdentityService.Services;

public sealed class Sha256PasswordHasher : IPasswordHasher
{
    public string Hash(string plainText)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(plainText));
        return Convert.ToHexString(bytes);
    }

    public bool Verify(string plainText, string hash) => Hash(plainText).Equals(hash, StringComparison.OrdinalIgnoreCase);
}

