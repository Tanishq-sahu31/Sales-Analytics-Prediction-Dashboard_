/**
 * sampleData.js
 * 
 * Why this file exists:
 * It generates a realistic, 500-row sales dataset in CSV format. 
 * This gives the user instant sample data to test the application,
 * and simulates a real corporate CSV export.
 * 
 * How it works:
 * We define standard products, categories, base prices, and profit margins.
 * Then, we loop 500 times, generating dates chronologically spanning from 
 * Jan 1, 2025 onwards, introducing controlled randomness to simulate sales.
 */

// Namespace the generator to avoid polluting the global window object directly
window.SampleDataGenerator = {
  
  /**
   * Generates a string containing CSV data of approximately 500 records.
   * @returns {string} - Raw CSV formatted data
   */
  generateCSV: function() {
    // 1. Define standard columns (header row)
    const headers = ["Date", "Customer", "Product", "Category", "Region", "Quantity", "Price", "Revenue", "Profit"];
    const rows = [];
    rows.push(headers.join(",")); // Create the header row in CSV: Date,Customer,...

    // 2. Define standard lists of products with their category, price, and profit margin.
    // This allows us to keep price and profit margin realistic.
    const productsCatalog = [
      // Electronics
      { name: "Laptop Pro", category: "Electronics", price: 75000.00, margin: 0.15 },
      { name: "Smartphone X", category: "Electronics", price: 45000.00, margin: 0.18 },
      { name: "Noise Cancelling Headphones", category: "Electronics", price: 15000.00, margin: 0.25 },
      { name: "Smart Watch Elite", category: "Electronics", price: 12000.00, margin: 0.22 },
      
      // Office Supplies
      { name: "Premium Leather Notebook", category: "Office Supplies", price: 350.00, margin: 0.50 },
      { name: "Ergonomic Desk Organizer", category: "Office Supplies", price: 800.00, margin: 0.45 },
      { name: "Heavy Duty Paper Shredder", category: "Office Supplies", price: 6500.00, margin: 0.35 },
      { name: "Fine Gel Pen Set (12-pack)", category: "Office Supplies", price: 120.00, margin: 0.60 },

      // Furniture
      { name: "Ergonomic Mesh Chair", category: "Furniture", price: 12500.00, margin: 0.25 },
      { name: "Standing Wooden Desk", category: "Furniture", price: 22000.00, margin: 0.20 },
      { name: "Dual Monitor Arm Mount", category: "Furniture", price: 4500.00, margin: 0.30 },
      { name: "Dimmable LED Desk Lamp", category: "Furniture", price: 1200.00, margin: 0.40 },

      // Apparel
      { name: "Classic Cotton Hoodie", category: "Apparel", price: 1800.00, margin: 0.45 },
      { name: "Dry-Fit Training Shoes", category: "Apparel", price: 4500.00, margin: 0.30 },
      { name: "Casual Denim Jacket", category: "Apparel", price: 2500.00, margin: 0.35 },
      { name: "Bamboo Socks Pack (5 pairs)", category: "Apparel", price: 450.00, margin: 0.55 }
    ];

    const regions = ["North Zone", "East Zone", "West Zone", "South Zone"];

    // 3. Setup chronological date generation
    // We want dates spread across 18 months, starting Jan 1, 2025
    let currentDate = new Date(2025, 0, 1); // Month is 0-indexed in JS (0 = January)
    const totalRecords = 500;

    // To simulate a business growing over time, we will increase average quantities
    // sold and skew regions/products slightly based on progress.
    for (let i = 1; i <= totalRecords; i++) {
      // Advance date slightly for each record.
      // 500 records spread over ~540 days means about 1 record every 26 hours.
      // We add random hours so transactions occur at different times and dates.
      const hoursToAdd = 18 + Math.floor(Math.random() * 16); // 18 to 34 hours
      currentDate.setHours(currentDate.getHours() + hoursToAdd);

      // Format date as DD/MM/YYYY
      const year = currentDate.getFullYear();
      
      // Pad month and date with a leading zero if they are single digits (e.g. 9 -> 09)
      const monthVal = currentDate.getMonth() + 1;
      const month = monthVal < 10 ? "0" + monthVal : monthVal;
      
      const dayVal = currentDate.getDate();
      const day = dayVal < 10 ? "0" + dayVal : dayVal;
      
      const dateString = `${day}/${month}/${year}`;

      // 4. Generate random transactional attributes
      // Choose product randomly from catalog
      const productIndex = Math.floor(Math.random() * productsCatalog.length);
      const product = productsCatalog[productIndex];

      // Choose region randomly
      const regionIndex = Math.floor(Math.random() * regions.length);
      const region = regions[regionIndex];

      // Generate a random Customer ID (e.g. CUST-1001 to CUST-1040)
      const customerIdNum = 1001 + Math.floor(Math.random() * 40);
      const customerId = "CUST-" + customerIdNum;

      // Quantity: random value (normally 1 to 5, occasionally larger wholesale up to 10)
      let quantity = 1 + Math.floor(Math.random() * 4);
      if (Math.random() > 0.92) {
        quantity = 6 + Math.floor(Math.random() * 5); // Wholesale orders (6-10 items)
      }

      // 5. Compute Financial Columns
      const price = product.price;
      const revenue = Number((quantity * price).toFixed(2));
      const profit = Number((revenue * product.margin).toFixed(2));

      // 6. Build the CSV Row
      // Format: Date,Customer,Product,Category,Region,Quantity,Price,Revenue,Profit
      // If product name has commas, we should enclose in quotes, but our product catalog names don't.
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

    // 7. Join rows with newline characters
    return rows.join("\n");
  }
};
