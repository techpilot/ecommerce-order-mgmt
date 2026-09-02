using InventoryService.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Retry;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=inventory.db"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Polly resilience pipeline for transient failures (brief section B, "Resilience").
// SQLite raises SqliteException with error code 5 (SQLITE_BUSY) / 6 (SQLITE_LOCKED)
// when a concurrent writer holds the file lock -- exactly the scenario the reserve
// endpoint hits under concurrent order load. DbUpdateException wraps the same case
// when EF surfaces it during ExecuteUpdateAsync. Retry with exponential backoff +
// jitter so two colliding requests don't retry in lockstep and re-collide.
builder.Services.AddSingleton(new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        ShouldHandle = new PredicateBuilder()
            .Handle<SqliteException>(ex => ex.SqliteErrorCode is 5 or 6)
            .Handle<DbUpdateException>()
            .Handle<TimeoutException>(),
        MaxRetryAttempts = 3,
        Delay = TimeSpan.FromMilliseconds(100),
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true,
    })
    .Build());

var app = builder.Build();

// Ensure DB created + seeded on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

// GET /inventory/{sku} — fetch current stock for a SKU.
app.MapGet("/inventory/{sku}", async (string sku, InventoryDbContext db, ResiliencePipeline resilience) =>
{
    var product = await resilience.ExecuteAsync(async ct =>
        await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Sku == sku, ct));

    return product is null
        ? Results.NotFound(new { error = "SKU_NOT_FOUND", sku })
        : Results.Ok(new { product.Sku, product.Name, product.StockQuantity });
});

// POST /inventory/reserve — atomically decrement stock, guarding against race conditions.
// Uses a single conditional UPDATE (WHERE StockQuantity >= @qty) so two concurrent
// requests for the same SKU can never both succeed against insufficient stock —
// the DB row lock during the UPDATE serializes the check-and-decrement as one step,
// no separate read-then-write, no optimistic-retry loop needed. The Polly pipeline
// sits around that call to absorb the transient SQLITE_BUSY that same concurrency
// can trigger at the file-lock level (a DB-level concern, distinct from the
// business-level stock race the conditional UPDATE already solves).
app.MapPost("/inventory/reserve", async (ReserveRequest request, InventoryDbContext db, ResiliencePipeline resilience) =>
{
    if (request.Quantity <= 0)
        return Results.BadRequest(new { error = "INVALID_QUANTITY" });

    var rowsAffected = await resilience.ExecuteAsync(async ct =>
        await db.Products
            .Where(p => p.Sku == request.Sku && p.StockQuantity >= request.Quantity)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.StockQuantity, p => p.StockQuantity - request.Quantity), ct));

    if (rowsAffected == 0)
    {
        var exists = await db.Products.AnyAsync(p => p.Sku == request.Sku);
        return exists
            ? Results.Conflict(new { error = "INSUFFICIENT_STOCK", sku = request.Sku })
            : Results.NotFound(new { error = "SKU_NOT_FOUND", sku = request.Sku });
    }

    var updated = await db.Products.AsNoTracking().FirstAsync(p => p.Sku == request.Sku);
    return Results.Ok(new { updated.Sku, updated.StockQuantity, reserved = request.Quantity });
});

app.Run();

record ReserveRequest(string Sku, int Quantity);
