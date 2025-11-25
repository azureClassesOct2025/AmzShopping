using IdentityService.Models;
using Marketplace.Contracts;

namespace IdentityService.Services;

public interface IUserStore
{
    Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<UserAccount?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    Task<UserAccount> CreateAsync(AuthenticateRequest request, Func<string, string> hashFactory, CancellationToken cancellationToken = default);
}

