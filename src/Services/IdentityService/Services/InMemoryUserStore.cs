using System.Collections.Concurrent;
using IdentityService.Models;
using Marketplace.Contracts;

namespace IdentityService.Services;

public sealed class InMemoryUserStore : IUserStore
{
    private readonly ConcurrentDictionary<string, UserAccount> _usersByEmail = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, UserAccount> _usersById = new();

    public Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        _usersByEmail.TryGetValue(email, out var account);
        return Task.FromResult(account);
    }

    public Task<UserAccount?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        _usersById.TryGetValue(id, out var account);
        return Task.FromResult(account);
    }

    public Task<UserAccount> CreateAsync(AuthenticateRequest request, Func<string, string> hashFactory, CancellationToken cancellationToken = default)
    {
        var userId = Guid.NewGuid().ToString("N");
        var account = new UserAccount(
            userId,
            request.Email,
            request.FullName ?? "Amazon Customer",
            hashFactory(request.Password),
            Tier: "Prime",
            LoyaltyPoints: Random.Shared.Next(50, 500));

        if (!_usersByEmail.TryAdd(request.Email, account))
        {
            throw new InvalidOperationException("Email already exists");
        }

        _usersById.TryAdd(userId, account);
        return Task.FromResult(account);
    }
}

