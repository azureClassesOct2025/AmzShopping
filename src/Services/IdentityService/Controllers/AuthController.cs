using IdentityService.Services;
using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace IdentityService.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserStore _userStore;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public AuthController(IUserStore userStore, IPasswordHasher hasher, ITokenService tokenService)
    {
        _userStore = userStore;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthenticateResponse>> Register([FromBody] AuthenticateRequest request, CancellationToken cancellationToken)
    {
        var existing = await _userStore.GetByEmailAsync(request.Email, cancellationToken);
        if (existing is not null)
        {
            return Conflict(new ApiError("identity.conflict", "Email already registered."));
        }

        var account = await _userStore.CreateAsync(request, _hasher.Hash, cancellationToken);
        return Ok(ToResponse(account));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthenticateResponse>> Login([FromBody] AuthenticateRequest request, CancellationToken cancellationToken)
    {
        var account = await _userStore.GetByEmailAsync(request.Email, cancellationToken);
        if (account is null || !_hasher.Verify(request.Password, account.PasswordHash))
        {
            return Unauthorized(new ApiError("identity.invalidCredentials", "Incorrect email or password."));
        }

        return Ok(ToResponse(account));
    }

    [HttpGet("profile/{userId}")]
    public async Task<ActionResult<UserProfile>> GetProfile([FromRoute] string userId, CancellationToken cancellationToken)
    {
        var account = await _userStore.GetByIdAsync(userId, cancellationToken);
        if (account is null)
        {
            return NotFound(new ApiError("identity.notFound", "User was not found."));
        }

        var profile = new UserProfile(account.Id, account.Email, account.FullName, account.Tier, account.LoyaltyPoints);
        return Ok(profile);
    }

    private AuthenticateResponse ToResponse(IdentityService.Models.UserAccount account)
    {
        var token = _tokenService.IssueToken(account);
        return new AuthenticateResponse(account.Id, account.Email, account.FullName, token);
    }
}

