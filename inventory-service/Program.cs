using InventoryService.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=inventory.db"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure DB created + seeded on startup (fine for a take-home; use migrations in real prod).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

// GET /inventory/{sku} — fetch current stock for a SKU.
app.MapGet("/inventory/{sku}", async (string sku, InventoryDbContext db) =>
{
    var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Sku == sku);
    return product is null
        ? Results.NotFound(new { error = "SKU_NOT_FOUND", sku })
        : Results.Ok(new { product.Sku, product.Name, product.StockQuantity });
});

// POST /inventory/reserve — atomically decrement stock, guarding against race conditions.
// Uses a single conditional UPDATE (WHERE StockQuantity >= @qty) so two concurrent
// requests for the same SKU can never both succeed against insufficient stock —
// the DB row lock during the UPDATE serializes the check-and-decrement as one step,
// no separate read-then-write, no optimistic-retry loop needed.
app.MapPost("/inventory/reserve", async (ReserveRequest request, InventoryDbContext db) =>
{
    if (request.Quantity <= 0)
        return Results.BadRequest(new { error = "INVALID_QUANTITY" });

    var rowsAffected = await db.Products
        .Where(p => p.Sku == request.Sku && p.StockQuantity >= request.Quantity)
        .ExecuteUpdateAsync(setters => setters
            .SetProperty(p => p.StockQuantity, p => p.StockQuantity - request.Quantity));

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
