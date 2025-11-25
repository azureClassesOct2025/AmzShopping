using System.Collections.Concurrent;
using Marketplace.Contracts;

namespace OrderingService.Services;

public sealed class OrderStore
{
    private readonly ConcurrentDictionary<Guid, OrderDto> _orders = new();

    public OrderDto CreateOrder(CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new ArgumentException("Order must contain at least one item.");
        }

        var total = request.Items.Sum(i => i.UnitPrice * i.Quantity);
        var order = new OrderDto(Guid.NewGuid(), request.UserId, DateTimeOffset.UtcNow, "Processing", total, request.Items.ToArray());

        _orders[order.Id] = order;
        return order;
    }

    public OrderDto? GetOrder(Guid id) => _orders.TryGetValue(id, out var order) ? order : null;

    public IEnumerable<OrderDto> GetOrdersForUser(string userId) =>
        _orders.Values.Where(o => o.UserId.Equals(userId, StringComparison.OrdinalIgnoreCase)).OrderByDescending(o => o.CreatedOn);

    public OrderDto? UpdateStatus(Guid id, string status)
    {
        if (!_orders.TryGetValue(id, out var order))
        {
            return null;
        }

        var updated = order with { Status = status };
        _orders[id] = updated;
        return updated;
    }
}

