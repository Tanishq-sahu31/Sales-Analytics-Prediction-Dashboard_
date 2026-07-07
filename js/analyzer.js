/**
 * analyzer.js
 * 
 * Why this file exists:
 * It contains the pure mathematical core of our dashboard. Instead of relying on 
 * heavy math or statistics libraries, we write the algorithms manually.
 * This demonstrates a strong grasp of data structures, sorting, and algebra.
 * 
 * How it works:
 * - We write clear helper functions to calculate sums, averages, and spreads.
 * - We aggregate transaction arrays into key-value maps (objects) to group 
 *   sales by Month, Category, Region, and Product, and then sort them to find top performers.
 */

window.SalesAnalyzer = {

  /**
   * Run all key aggregations and statistical calculations in one go.
   * @param {Array} data - Array of cleaned sales objects
   * @returns {Object} - Complete analyzed results object
   */
  analyze: function(data) {
    if (!data || data.length === 0) {
      return null;
    }

    // 1. Core aggregates
    const totalOrders = data.length;
    let totalRevenue = 0;
    let totalProfit = 0;

    for (let i = 0; i < data.length; i++) {
      totalRevenue += data[i].revenue;
      totalProfit += data[i].profit;
    }

    // Round values to 2 decimal places to prevent float rounding errors (e.g. 0.1 + 0.2 = 0.30000000004)
    totalRevenue = Number(totalRevenue.toFixed(2));
    totalProfit = Number(totalProfit.toFixed(2));
    const avgOrderValue = Number((totalRevenue / totalOrders).toFixed(2));

    // 2. Extract arrays for statistics
    const revenues = [];
    const quantities = [];
    for (let i = 0; i < data.length; i++) {
      revenues.push(data[i].revenue);
      quantities.push(data[i].quantity);
    }

    // 3. Compute manual descriptive statistics on Revenue & Quantity
    const mean = this.calculateMean(revenues);
    const median = this.calculateMedian(revenues);
    const mode = this.calculateMode(quantities); // Mode is on order quantities
    const variance = this.calculateVariance(revenues, mean);
    const stdDev = this.calculateStdDev(variance);

    // 4. Compute grouped aggregations
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

  /* ==========================================================================
     MANUAL MATH & STATISTICS FORMULAS
     ========================================================================== */

  /**
   * Calculates the Mean (Arithmetic Average) of an array of numbers.
   * Formula: Mean = Sum(x) / N
   * Time Complexity: O(N)
   */
  calculateMean: function(values) {
    if (values.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return Number((sum / values.length).toFixed(2));
  },

  /**
   * Calculates the Median (Middle Value) of an array of numbers.
   * Algorithm:
   * 1. Clone and sort the array in ascending order.
   * 2. If length (N) is odd, return the middle element at index floor(N/2).
   * 3. If length (N) is even, return the average of the two middle elements at N/2 and N/2 - 1.
   * Time Complexity: O(N log N) due to sorting.
   */
  calculateMedian: function(values) {
    if (values.length === 0) return 0;
    
    // We clone the array using slice() so we don't mutate the original array order.
    // We pass a custom compare function (a, b) => a - b because default JS sort() 
    // sorts items alphabetically (lexicographically)!
    const sorted = values.slice().sort(function(a, b) {
      return a - b;
    });

    const half = Math.floor(sorted.length / 2);

    if (sorted.length % 2 !== 0) {
      // Odd number of elements
      return Number(sorted[half].toFixed(2));
    } else {
      // Even number of elements: average the two middle values
      const midVal = (sorted[half - 1] + sorted[half]) / 2;
      return Number(midVal.toFixed(2));
    }
  },

  /**
   * Calculates the Mode (Most Frequent Value) of an array of numbers.
   * Algorithm:
   * 1. Build a Frequency Map (hash map) to count occurrences.
   * 2. Track the element with the highest occurrence count.
   * Time Complexity: O(N)
   */
  calculateMode: function(values) {
    if (values.length === 0) return 0;

    const frequencyMap = {};
    let maxCount = 0;
    let modeValue = values[0];

    for (let i = 0; i < values.length; i++) {
      const num = values[i];
      
      // If number is already in map, increment; otherwise, initialize it at 1.
      if (frequencyMap[num]) {
        frequencyMap[num]++;
      } else {
        frequencyMap[num] = 1;
      }

      // Check if this number has the highest frequency so far
      if (frequencyMap[num] > maxCount) {
        maxCount = frequencyMap[num];
        modeValue = num;
      }
    }

    return modeValue;
  },

  /**
   * Calculates the Variance (spread of values around the mean).
   * Formula: Variance (σ²) = Σ(x - Mean)² / N
   * Time Complexity: O(N)
   */
  calculateVariance: function(values, mean) {
    if (values.length === 0) return 0;

    let sumSquaredDifferences = 0;
    for (let i = 0; i < values.length; i++) {
      const difference = values[i] - mean;
      sumSquaredDifferences += difference * difference; // Square the difference
    }

    const variance = sumSquaredDifferences / values.length;
    return Number(variance.toFixed(2));
  },

  /**
   * Calculates the Standard Deviation (σ).
   * Formula: StdDev = SquareRoot(Variance)
   * Time Complexity: O(1) (after variance is calculated)
   */
  calculateStdDev: function(variance) {
    const stdDev = Math.sqrt(variance);
    return Number(stdDev.toFixed(2));
  },

  /* ==========================================================================
     AGGREGATION METHODS (For Charting and Rankings)
     ========================================================================== */

  /**
   * Aggregates sales and profits chronologically by month.
   * Returns sorted arrays of labels, revenues, and profits.
   */
  aggregateByMonth: function(data) {
    const monthlyMap = {}; // Key: "YYYY-MM", Value: { revenue, profit }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      // extract "YYYY-MM" from date string "YYYY-MM-DD"
      const month = row.date.substring(0, 7);

      if (!monthlyMap[month]) {
        monthlyMap[month] = { revenue: 0, profit: 0 };
      }
      monthlyMap[month].revenue += row.revenue;
      monthlyMap[month].profit += row.profit;
    }

    // Extract monthly keys and sort them chronologically (lexicographical sort works for YYYY-MM)
    const sortedMonths = Object.keys(monthlyMap).sort();
    
    const labels = [];
    const revenues = [];
    const profits = [];

    for (let i = 0; i < sortedMonths.length; i++) {
      const month = sortedMonths[i];
      const parts = month.split("-"); // parts[0] is YYYY, parts[1] is MM
      labels.push(parts[1] + "/" + parts[0]); // Format as MM/YYYY
      revenues.push(Number(monthlyMap[month].revenue.toFixed(2)));
      profits.push(Number(monthlyMap[month].profit.toFixed(2)));
    }

    return { labels: labels, revenues: revenues, profits: profits };
  },

  /**
   * Aggregates revenue by Product Category.
   * Returns category labels and revenue totals.
   */
  aggregateByCategory: function(data) {
    const categoryMap = {}; // Key: Category, Value: Revenue

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

  /**
   * Aggregates revenue by geographic Region.
   */
  aggregateByRegion: function(data) {
    const regionMap = {}; // Key: Region, Value: Revenue

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

  /**
   * Aggregates revenue by individual Product and returns the TOP 5 items.
   * Sorts products in descending order of revenue.
   */
  aggregateByProduct: function(data) {
    const productMap = {}; // Key: Product Name, Value: { revenue, quantity }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!productMap[row.product]) {
        productMap[row.product] = { revenue: 0, quantity: 0 };
      }
      productMap[row.product].revenue += row.revenue;
      productMap[row.product].quantity += row.quantity;
    }

    // Convert map to list of products so we can sort them
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

    // Sort products by revenue descending (highest revenue first)
    productList.sort(function(a, b) {
      return b.revenue - a.revenue;
    });

    // Take top 5 products (or less if there are fewer than 5 unique products)
    const topLimit = Math.min(5, productList.length);
    const topProducts = [];
    for (let i = 0; i < topLimit; i++) {
      topProducts.push(productList[i]);
    }

    // Prepare lists for Chart.js rendering
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
