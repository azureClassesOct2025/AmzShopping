namespace Marketplace.Contracts;

public record AuthenticateRequest(string Email, string Password, string? FullName = null);

public record AuthenticateResponse(string UserId, string Email, string FullName, string Token);

public record UserProfile(string Id, string Email, string FullName, string Tier, int LoyaltyPoints);

public record ProductDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    decimal Price,
    decimal? ListPrice,
    double Rating,
    bool IsPrimeEligible,
    string ImageUrl);

public record CategoryDto(string Name, string HeroImage);

public record OrderItemDto(Guid ProductId, string Title, int Quantity, decimal UnitPrice);

public record CreateOrderRequest(string UserId, IReadOnlyCollection<OrderItemDto> Items, string ShippingAddress);

public record OrderDto(Guid Id, string UserId, DateTimeOffset CreatedOn, string Status, decimal Total, IReadOnlyCollection<OrderItemDto> Items);

public record StorefrontSnapshot(
    IReadOnlyCollection<CategoryDto> Categories,
    IReadOnlyCollection<ProductDto> FeaturedProducts,
    IReadOnlyCollection<ProductDto> Deals);

public record ApiError(string Code, string Message);

public record PaymentRequest(
    decimal Amount,
    string Currency,
    string CardHolder,
    string CardNumber,
    string Expiry,
    string Cvv,
    string Email);

public record PaymentResponse(
    string TransactionId,
    string Status,
    DateTimeOffset ProcessedAt);
