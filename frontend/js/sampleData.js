// sampleData.js
// Generates a mock dataset of 500 records in CSV format so the dashboard has initial values to display.

window.SampleDataGenerator = {
  
  // Generates raw CSV formatted data
  generateCSV: function() {
    const headers = ["Date", "Customer", "Product", "Category", "Region", "Quantity", "Price", "Revenue", "Profit"];
    const rows = [];
    rows.push(headers.join(",")); // Header row

    // Product catalog with category, pricing, and profit margin
    const productsCatalog = [
      { name: "Laptop Pro", category: "Electronics", price: 75000.00, margin: 0.15 },
      { name: "Smartphone X", category: "Electronics", price: 45000.00, margin: 0.18 },
      { name: "Noise Cancelling Headphones", category: "Electronics", price: 15000.00, margin: 0.25 },
      { name: "Smart Watch Elite", category: "Electronics", price: 12000.00, margin: 0.22 },
      
      { name: "Premium Leather Notebook", category: "Office Supplies", price: 350.00, margin: 0.50 },
      { name: "Ergonomic Desk Organizer", category: "Office Supplies", price: 800.00, margin: 0.45 },
      { name: "Heavy Duty Paper Shredder", category: "Office Supplies", price: 6500.00, margin: 0.35 },
      { name: "Fine Gel Pen Set (12-pack)", category: "Office Supplies", price: 120.00, margin: 0.60 },

      { name: "Ergonomic Mesh Chair", category: "Furniture", price: 12500.00, margin: 0.25 },
      { name: "Standing Wooden Desk", category: "Furniture", price: 22000.00, margin: 0.20 },
      { name: "Dual Monitor Arm Mount", category: "Furniture", price: 4500.00, margin: 0.30 },
      { name: "Dimmable LED Desk Lamp", category: "Furniture", price: 1200.00, margin: 0.40 },

      { name: "Classic Cotton Hoodie", category: "Apparel", price: 1800.00, margin: 0.45 },
      { name: "Dry-Fit Training Shoes", category: "Apparel", price: 4500.00, margin: 0.30 },
      { name: "Casual Denim Jacket", category: "Apparel", price: 2500.00, margin: 0.35 },
      { name: "Bamboo Socks Pack (5 pairs)", category: "Apparel", price: 450.00, margin: 0.55 }
    ];

    const regions = ["North Zone", "East Zone", "West Zone", "South Zone"];

    // Setup start date for chronological data generation
    let currentDate = new Date(2025, 0, 1); // Jan 1, 2025
    const totalRecords = 500;

    for (let i = 1; i <= totalRecords; i++) {
      // Advance date randomly by 18-34 hours for each transaction
      const hoursToAdd = 18 + Math.floor(Math.random() * 16);
      currentDate.setHours(currentDate.getHours() + hoursToAdd);

      // Format as DD/MM/YYYY
      const year = currentDate.getFullYear();
      const monthVal = currentDate.getMonth() + 1;
      const month = monthVal < 10 ? "0" + monthVal : monthVal;
      const dayVal = currentDate.getDate();
      const day = dayVal < 10 ? "0" + dayVal : dayVal;
      const dateString = `${day}/${month}/${year}`;

      // Pick standard customer and item fields
      const productIndex = Math.floor(Math.random() * productsCatalog.length);
      const product = productsCatalog[productIndex];
      const regionIndex = Math.floor(Math.random() * regions.length);
      const region = regions[regionIndex];
      const customerIdNum = 1001 + Math.floor(Math.random() * 40);
      const customerId = "CUST-" + customerIdNum;

      // Quantity ordered (normally 1-5, occasionally up to 10)
      let quantity = 1 + Math.floor(Math.random() * 4);
      if (Math.random() > 0.92) {
        quantity = 6 + Math.floor(Math.random() * 5);
      }

      // Calculations
      const price = product.price;
      const revenue = Number((quantity * price).toFixed(2));
      const profit = Number((revenue * product.margin).toFixed(2));

      // Append row content
      const row = [
        dateString,
        customerId,
        product.name,
        product.category,
        region,
        quantity,
        price.toFixed(2),
        revenue.toFixed(2),
        profit.toFixed(2)
      ];

      rows.push(row.join(","));
    }

    return rows.join("\n");
  }
};
