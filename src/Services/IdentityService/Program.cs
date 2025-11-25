using IdentityService.Services;
using Marketplace.Contracts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<IPasswordHasher, Sha256PasswordHasher>();
builder.Services.AddSingleton<ITokenService, SimpleTokenService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapControllers();

await SeedDefaultUserAsync(app.Services);

app.Run();

static async Task SeedDefaultUserAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var store = scope.ServiceProvider.GetRequiredService<IUserStore>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    var existing = await store.GetByEmailAsync("jane@amazon-demo.com");
    if (existing is null)
    {
        var request = new AuthenticateRequest("jane@amazon-demo.com", "Sup3rSecure!", "Jane Demo");
        await store.CreateAsync(request, hasher.Hash);
    }
}
