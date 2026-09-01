using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data;

public class Product
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
}

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.Sku).IsUnique();
        });

        // Seed 10 products with stock levels (per brief).
        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Sku = "SKU-001", Name = "Wireless Mouse", StockQuantity = 50 },
            new Product { Id = 2, Sku = "SKU-002", Name = "Mechanical Keyboard", StockQuantity = 30 },
            new Product { Id = 3, Sku = "SKU-003", Name = "USB-C Hub", StockQuantity = 75 },
            new Product { Id = 4, Sku = "SKU-004", Name = "27in Monitor", StockQuantity = 15 },
            new Product { Id = 5, Sku = "SKU-005", Name = "Webcam 1080p", StockQuantity = 40 },
            new Product { Id = 6, Sku = "SKU-006", Name = "Laptop Stand", StockQuantity = 60 },
            new Product { Id = 7, Sku = "SKU-007", Name = "Noise-Cancelling Headset", StockQuantity = 25 },
            new Product { Id = 8, Sku = "SKU-008", Name = "Desk Mat", StockQuantity = 100 },
            new Product { Id = 9, Sku = "SKU-009", Name = "Ergonomic Chair", StockQuantity = 10 },
            new Product { Id = 10, Sku = "SKU-010", Name = "Portable SSD 1TB", StockQuantity = 45 }
        );
    }
}
