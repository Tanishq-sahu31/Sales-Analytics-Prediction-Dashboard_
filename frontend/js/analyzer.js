// analyzer.js
// Handles all manual statistical calculations (Mean, Median, Mode, Variance, Standard Deviation).
// It also groups sales data by category, region, and products to draw graphs.

window.SalesAnalyzer = {

  // Runs all math calculations and aggregates in one call
  analyze: function(data) {
    if (!data || data.length === 0) {
      return null;
    }

    // Calculate core totals
    const totalOrders = data.length;
    let totalRevenue = 0;
    let totalProfit = 0;

    for (let i = 0; i < data.length; i++) {
      totalRevenue += data[i].revenue;
      totalProfit += data[i].profit;
    }

    totalRevenue = Number(totalRevenue.toFixed(2));
    totalProfit = Number(totalProfit.toFixed(2));
    const avgOrderValue = Number((totalRevenue / totalOrders).toFixed(2));

    // Get arrays of numbers for statistics
    const revenues = [];
    const quantities = [];
    for (let i = 0; i < data.length; i++) {
      revenues.push(data[i].revenue);
      quantities.push(data[i].quantity);
    }

    // Call mathematical calculations
    const mean = this.calculateMean(revenues);
    const median = this.calculateMedian(revenues);
    const mode = this.calculateMode(quantities);
    const variance = this.calculateVariance(revenues, mean);
    const stdDev = this.calculateStdDev(variance);

    // Group sales data
    const monthlySales = this.aggregateByMonth(data);
    const categorySales = this.aggregateByCategory(data);
    const regionSales = this.aggregateByRegion(data);
    const productSales = this.aggregateByProduct(data);

    return {
      summary: {
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        avgOrderValue: avgOrderValue
      },
      stats: {
        mean: mean,
        median: median,
        mode: mode,
        variance: variance,
        stdDev: stdDev
      },
      aggregations: {
        monthly: monthlySales,
        category: categorySales,
        region: regionSales,
        product: productSales
      }
    };
  },

  // Average = Sum / N
  calculateMean: function(values) {
    if (values.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return Number((sum / values.length).toFixed(2));
  },

  // Median (middle value) of a sorted array
  calculateMedian: function(values) {
    if (values.length === 0) return 0;
    
    // Sort array copies so we don't mess up chronological orders in other functions
    const sorted = values.slice().sort(function(a, b) {
      return a - b;
    });

    const half = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
      return Number(sorted[half].toFixed(2)); // Odd count: middle number
    } else {
      const midVal = (sorted[half - 1] + sorted[half]) / 2; // Even count: average of middle two
      return Number(midVal.toFixed(2));
    }
  },

  // Mode (most frequent value) using a map to count occurrences
  calculateMode: function(values) {
    if (values.length === 0) return 0;

    const frequencyMap = {};
    let maxCount = 0;
    let modeValue = values[0];

    for (let i = 0; i < values.length; i++) {
      const num = values[i];
      if (frequencyMap[num]) {
        frequencyMap[num]++;
      } else {
        frequencyMap[num] = 1;
      }

      if (frequencyMap[num] > maxCount) {
        maxCount = frequencyMap[num];
        modeValue = num;
      }
    }

    return modeValue;
  },

  // Variance: sum of squared differences from the average, divided by N
  calculateVariance: function(values, mean) {
    if (values.length === 0) return 0;

    let sumSquaredDifferences = 0;
    for (let i = 0; i < values.length; i++) {
      const difference = values[i] - mean;
      sumSquaredDifferences += difference * difference;
    }

    const variance = sumSquaredDifferences / values.length;
    return Number(variance.toFixed(2));
  },

  // Standard Deviation: square root of Variance
  calculateStdDev: function(variance) {
    const stdDev = Math.sqrt(variance);
    return Number(stdDev.toFixed(2));
  },

  // Group revenue and profit by month ("MM/YYYY")
  aggregateByMonth: function(data) {
    const monthlyMap = {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const month = row.date.substring(0, 7); // extract "YYYY-MM"

      if (!monthlyMap[month]) {
        monthlyMap[month] = { revenue: 0, profit: 0 };
      }
      monthlyMap[month].revenue += row.revenue;
      monthlyMap[month].profit += row.profit;
    }

    const sortedMonths = Object.keys(monthlyMap).sort();
    
    const labels = [];
    const revenues = [];
    const profits = [];

    for (let i = 0; i < sortedMonths.length; i++) {
      const month = sortedMonths[i];
      const parts = month.split("-");
      labels.push(parts[1] + "/" + parts[0]); // Format as MM/YYYY
      revenues.push(Number(monthlyMap[month].revenue.toFixed(2)));
      profits.push(Number(monthlyMap[month].profit.toFixed(2)));
    }

    return { labels: labels, revenues: revenues, profits: profits };
  },

  // Group revenue by product category
  aggregateByCategory: function(data) {
    const categoryMap = {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!categoryMap[row.category]) {
        categoryMap[row.category] = 0;
      }
      categoryMap[row.category] += row.revenue;
    }

    const labels = Object.keys(categoryMap);
    const revenues = [];
    for (let i = 0; i < labels.length; i++) {
      revenues.push(Number(categoryMap[labels[i]].toFixed(2)));
    }

    return { labels: labels, revenues: revenues };
  },

  // Group revenue by sales region
  aggregateByRegion: function(data) {
    const regionMap = {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!regionMap[row.region]) {
        regionMap[row.region] = 0;
      }
      regionMap[row.region] += row.revenue;
    }

    const labels = Object.keys(regionMap);
    const revenues = [];
    for (let i = 0; i < labels.length; i++) {
      revenues.push(Number(regionMap[labels[i]].toFixed(2)));
    }

    return { labels: labels, revenues: revenues };
  },

  // Group revenue by product name and get top 5 bestsellers
  aggregateByProduct: function(data) {
    const productMap = {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!productMap[row.product]) {
        productMap[row.product] = { revenue: 0, quantity: 0 };
      }
      productMap[row.product].revenue += row.revenue;
      productMap[row.product].quantity += row.quantity;
    }

    const productList = [];
    const keys = Object.keys(productMap);
    for (let i = 0; i < keys.length; i++) {
      const name = keys[i];
      productList.push({
        name: name,
        revenue: productMap[name].revenue,
        quantity: productMap[name].quantity
      });
    }

    // Sort descending by total revenue
    productList.sort(function(a, b) {
      return b.revenue - a.revenue;
    });

    const topLimit = Math.min(5, productList.length);
    const topProducts = [];
    for (let i = 0; i < topLimit; i++) {
      topProducts.push(productList[i]);
    }

    const labels = [];
    const revenues = [];
    const quantities = [];
    for (let i = 0; i < topProducts.length; i++) {
      labels.push(topProducts[i].name);
      revenues.push(Number(topProducts[i].revenue.toFixed(2)));
      quantities.push(topProducts[i].quantity);
    }

    return { labels: labels, revenues: revenues, quantities: quantities };
  }
};
