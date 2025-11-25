using Marketplace.Contracts;

namespace CatalogService.Services;

public sealed class CatalogStore
{
    private readonly List<ProductDto> _products;
    private readonly List<CategoryDto> _categories;

    public CatalogStore()
    {
        _products = SeedProducts();
        _categories = _products
            .Select(p => new CategoryDto(p.Category, $"https://picsum.photos/seed/{p.Category.ToLowerInvariant()}/800/400"))
            .DistinctBy(c => c.Name)
            .ToList();
    }

    public IEnumerable<ProductDto> GetAll(string? category = null, string? search = null)
    {
        var query = _products.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        return query;
    }

    public ProductDto? GetById(Guid id) => _products.FirstOrDefault(p => p.Id == id);

    public IEnumerable<ProductDto> GetFeatured(int take = 4) =>
        _products.OrderByDescending(p => p.Rating).Take(take);

    public IEnumerable<ProductDto> GetDeals(int take = 4) =>
        _products.Where(p => p.ListPrice.HasValue && p.Price < p.ListPrice.Value).OrderBy(p => p.Price).Take(take);

    public IEnumerable<CategoryDto> GetCategories() => _categories;

    public ProductDto AddProduct(string title, string description, string category, decimal price, decimal? listPrice, bool primeEligible)
    {
        var product = new ProductDto(Guid.NewGuid(), title, description, category, price, listPrice, Rating: 4.0, primeEligible, $"https://picsum.photos/seed/{title.GetHashCode()}/600/600");
        _products.Add(product);
        return product;
    }

    private static List<ProductDto> SeedProducts()
    {
        return new List<ProductDto>
        {
            new(Guid.NewGuid(), "Echo Show 10", "Smart display with Alexa", "Electronics", 249.99m, 279.99m, 4.8, true, "https://images.unsplash.com/photo-1510552776732-03e61cf4b144"),
            new(Guid.NewGuid(), "Fire HD 10", "Portable entertainment tablet", "Electronics", 149.99m, 199.99m, 4.6, true, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"),
            new(Guid.NewGuid(), "Kindle Scribe", "Premium reading & annotation device", "Books", 299.99m, 339.99m, 4.7, true, "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"),
            new(Guid.NewGuid(), "Basics Cotton Sheet Set", "Ultra-soft breathable sheets", "Home", 34.99m, null, 4.3, false, "https://images.unsplash.com/photo-1519710164239-da123dc03ef4"),
            new(Guid.NewGuid(), "Astro Robot", "Home monitoring robot", "Smart Home", 999.99m, 1099.99m, 4.2, true, "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d"),
            new(Guid.NewGuid(), "Prime Wardrobe Box", "Personal stylist picks", "Fashion", 59.99m, 79.99m, 4.5, true, "https://images.unsplash.com/photo-1441986300917-64674bd600d8"),
            new(Guid.NewGuid(), "Amazon Fresh Basket", "Weekly grocery essentials", "Grocery", 39.99m, 49.99m, 4.1, true, "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0"),
            new(Guid.NewGuid(), "Ring Video Doorbell Pro", "Smart security doorbell", "Smart Home", 229.99m, 259.99m, 4.6, true, "https://images.unsplash.com/photo-1489515217757-5fd1be406fef")
        };
    }
}

