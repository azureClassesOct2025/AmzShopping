using IdentityService.Models;

namespace IdentityService.Services;

public interface ITokenService
{
    string IssueToken(UserAccount account);
}

