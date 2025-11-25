using CatalogService.Services;
using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

[ApiController]
[Route("products")]
public sealed class ProductsController : ControllerBase
{
    private readonly CatalogStore _catalog;

    public ProductsController(CatalogStore catalog) => _catalog = catalog;

    [HttpGet]
    public ActionResult<IEnumerable<ProductDto>> GetProducts([FromQuery] string? category, [FromQuery] string? search)
        => Ok(_catalog.GetAll(category, search));

    [HttpGet("{id:guid}")]
    public ActionResult<ProductDto> GetProductById(Guid id)
    {
        var product = _catalog.GetById(id);
        return product is null ? NotFound(new ApiError("catalog.notFound", "Product not found.")) : Ok(product);
    }

    public sealed record CreateProductRequest(string Title, string Description, string Category, decimal Price, decimal? ListPrice, bool IsPrimeEligible);

    [HttpPost]
    public ActionResult<ProductDto> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (request.Price <= 0)
        {
            return BadRequest(new ApiError("catalog.invalidPrice", "Price must be greater than zero."));
        }

        var product = _catalog.AddProduct(request.Title, request.Description, request.Category, request.Price, request.ListPrice, request.IsPrimeEligible);
        return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
    }
}

