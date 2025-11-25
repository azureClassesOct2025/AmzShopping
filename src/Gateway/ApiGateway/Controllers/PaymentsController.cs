using Marketplace.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace ApiGateway.Controllers;

[ApiController]
[Route("payments")]
public class PaymentsController : ControllerBase
{
    [HttpPost("charge")]
    public ActionResult<PaymentResponse> Charge([FromBody] PaymentRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new ApiError("payments.invalidAmount", "Charge amount must be greater than zero."));
        }

        if (string.IsNullOrWhiteSpace(request.CardNumber) || request.CardNumber.Length < 4)
        {
            return BadRequest(new ApiError("payments.invalidCard", "Enter a valid card number."));
        }

        // Simulate gateway approval (for demo purposes only)
        var response = new PaymentResponse(
            TransactionId: Guid.NewGuid().ToString("N"),
            Status: "approved",
            ProcessedAt: DateTimeOffset.UtcNow);

        return Ok(response);
    }
}

