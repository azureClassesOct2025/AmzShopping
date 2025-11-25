using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;
using OrderingService.Services;

namespace OrderingService.Controllers;

[ApiController]
[Route("orders")]
public sealed class OrdersController : ControllerBase
{
    private readonly OrderStore _store;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(OrderStore store, ILogger<OrdersController> logger)
    {
        _store = store;
        _logger = logger;
    }

    [HttpPost]
    public ActionResult<OrderDto> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var order = _store.CreateOrder(request);
            _logger.LogInformation("Order {OrderId} created for user {UserId}", order.Id, order.UserId);
            return CreatedAtAction(nameof(GetOrderById), new { orderId = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiError("orders.invalid", ex.Message));
        }
    }

    [HttpGet("{orderId:guid}")]
    public ActionResult<OrderDto> GetOrderById(Guid orderId)
    {
        var order = _store.GetOrder(orderId);
        return order is null ? NotFound(new ApiError("orders.notFound", "Order not found.")) : Ok(order);
    }

    [HttpGet("by-user/{userId}")]
    public ActionResult<IEnumerable<OrderDto>> GetOrdersForUser(string userId) => Ok(_store.GetOrdersForUser(userId));

    public sealed record UpdateStatusRequest(string Status);

    [HttpPatch("{orderId:guid}/status")]
    public ActionResult<OrderDto> UpdateStatus(Guid orderId, [FromBody] UpdateStatusRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new ApiError("orders.invalidStatus", "Status cannot be empty."));
        }

        var updated = _store.UpdateStatus(orderId, request.Status);
        return updated is null ? NotFound(new ApiError("orders.notFound", "Order not found.")) : Ok(updated);
    }
}

