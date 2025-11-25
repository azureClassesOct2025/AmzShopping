using CatalogService.Services;
using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

[ApiController]
[Route("categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly CatalogStore _catalog;

    public CategoriesController(CatalogStore catalog) => _catalog = catalog;

    [HttpGet]
    public ActionResult<IEnumerable<CategoryDto>> GetCategories() => Ok(_catalog.GetCategories());

    [HttpGet("featured")]
    public ActionResult<StorefrontSnapshot> GetFeatured()
    {
        var snapshot = new StorefrontSnapshot(
            _catalog.GetCategories().ToArray(),
            _catalog.GetFeatured().ToArray(),
            _catalog.GetDeals().ToArray());

        return Ok(snapshot);
    }
}

