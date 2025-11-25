namespace ApiGateway.Options;

public sealed class ServiceEndpoints
{
    public string Identity { get; set; } = "http://localhost:5101";
    public string Catalog { get; set; } = "http://localhost:5201";
    public string Ordering { get; set; } = "http://localhost:5301";
}

