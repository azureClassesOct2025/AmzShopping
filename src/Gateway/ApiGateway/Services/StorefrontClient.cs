using System.Net.Http.Json;
using System.Net;
using Marketplace.Contracts;

namespace ApiGateway.Services;

public sealed class StorefrontClient
{
    private readonly IHttpClientFactory _factory;
    private readonly ILogger<StorefrontClient> _logger;

    public StorefrontClient(IHttpClientFactory factory, ILogger<StorefrontClient> logger)
    {
        _factory = factory;
        _logger = logger;
    }

    public async Task<StorefrontSnapshot?> GetStorefrontAsync(CancellationToken cancellationToken)
    {
        var catalogClient = _factory.CreateClient("catalog");
        return await catalogClient.GetFromJsonAsync<StorefrontSnapshot>("categories/featured", cancellationToken);
    }

    public async Task<OrderDto?> CheckoutAsync(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var ordersClient = _factory.CreateClient("ordering");
        var response = await ordersClient.PostAsJsonAsync("orders", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Checkout failed with status {StatusCode}", response.StatusCode);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<OrderDto>(cancellationToken: cancellationToken);
    }

    public async Task<UserProfile?> GetProfileAsync(string userId, CancellationToken cancellationToken)
    {
        var identityClient = _factory.CreateClient("identity");
        var response = await identityClient.GetAsync($"auth/profile/{userId}", cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Profile lookup failed with status {StatusCode}", response.StatusCode);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<UserProfile>(cancellationToken: cancellationToken);
    }
}

