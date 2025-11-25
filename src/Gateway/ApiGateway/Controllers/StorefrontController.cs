using ApiGateway.Services;
using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

[ApiController]
[Route("storefront")]
public sealed class StorefrontController : ControllerBase
{
    private readonly StorefrontClient _client;

    public StorefrontController(StorefrontClient client) => _client = client;

    [HttpGet("home")]
    public async Task<ActionResult<object>> GetHome([FromQuery] string? userId, CancellationToken cancellationToken)
    {
        var snapshotTask = _client.GetStorefrontAsync(cancellationToken);
        var profileTask = string.IsNullOrWhiteSpace(userId)
            ? Task.FromResult<UserProfile?>(null)
            : _client.GetProfileAsync(userId, cancellationToken);

        await Task.WhenAll(snapshotTask, profileTask);
        var snapshot = snapshotTask.Result;
        if (snapshot is null)
        {
            return StatusCode(503, new ApiError("gateway.catalogUnavailable", "Catalog service is unavailable."));
        }

        return Ok(new
        {
            profile = profileTask.Result,
            categories = snapshot.Categories,
            featured = snapshot.FeaturedProducts,
            deals = snapshot.Deals
        });
    }

    public sealed record CheckoutRequest(string UserId, IReadOnlyCollection<OrderItemDto> Items, string ShippingAddress);

    [HttpPost("checkout")]
    public async Task<ActionResult<OrderDto>> Checkout([FromBody] CheckoutRequest request, CancellationToken cancellationToken)
    {
        var orderRequest = new CreateOrderRequest(request.UserId, request.Items, request.ShippingAddress);
        var order = await _client.CheckoutAsync(orderRequest, cancellationToken);
        if (order is null)
        {
            return StatusCode(503, new ApiError("gateway.ordersUnavailable", "Ordering service is unavailable."));
        }

        return Ok(order);
    }
}

