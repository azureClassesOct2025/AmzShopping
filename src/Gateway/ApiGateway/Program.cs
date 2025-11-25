using ApiGateway.Options;
using ApiGateway.Services;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ServiceEndpoints>(builder.Configuration.GetSection("Services"));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddCors(policy => policy.AddDefaultPolicy(cfg => cfg.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddHttpClient("identity", (sp, client) =>
{
    var endpoints = sp.GetRequiredService<IOptions<ServiceEndpoints>>().Value;
    client.BaseAddress = new Uri(endpoints.Identity);
});

builder.Services.AddHttpClient("catalog", (sp, client) =>
{
    var endpoints = sp.GetRequiredService<IOptions<ServiceEndpoints>>().Value;
    client.BaseAddress = new Uri(endpoints.Catalog);
});

builder.Services.AddHttpClient("ordering", (sp, client) =>
{
    var endpoints = sp.GetRequiredService<IOptions<ServiceEndpoints>>().Value;
    client.BaseAddress = new Uri(endpoints.Ordering);
});

builder.Services.AddSingleton<StorefrontClient>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapControllers();

app.Run();
