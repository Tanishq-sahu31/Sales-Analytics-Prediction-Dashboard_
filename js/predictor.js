/**
 * predictor.js
 * 
 * Why this file exists:
 * It implements forecasting and business intelligence. Modern companies want 
 * to look forward, not just backward. We write simple, deterministic algorithms 
 * (no heavy ML models) to project next month's sales and generate helpful text-based insights.
 * 
 * How it works:
 * 1. 3-Month Moving Average: Averaging the revenue of the 3 most recent months.
 * 2. Simple Linear Trend: Calculating a trendline (y = mx + c) using Ordinary Least Squares regression.
 * 3. Rule-Based Insights: Applying basic logic checks on the analyzed outputs to generate readable insights.
 */

window.SalesPredictor = {

  /**
   * Forecasts next period sales using Moving Average and Linear Trend methods,
   * and generates descriptive text recommendations.
   * @param {Object} analysis - The results object output from SalesAnalyzer.analyze()
   * @returns {Object} - Predictions and list of insights strings
   */
  generateForecastsAndInsights: function(analysis) {
    if (!analysis) return null;

    const monthlyData = analysis.aggregations.monthly;
    const monthlyRevenues = monthlyData.revenues;
    
    // 1. Calculate Moving Average Forecast
    const movingAverageForecast = this.calculateMovingAverage(monthlyRevenues, 3);

    // 2. Calculate Linear Regression Trend Forecast
    const regressionResult = this.calculateLinearRegression(monthlyRevenues);

    // 3. Generate Business Insights
    const insights = this.generateInsights(analysis, regressionResult);

    return {
      movingAverage: movingAverageForecast,
      linearTrend: regressionResult.forecast,
      slope: regressionResult.slope,
      direction: regressionResult.slope > 0 ? "UP" : (regressionResult.slope < 0 ? "DOWN" : "FLAT"),
      insights: insights
    };
  },

  /**
   * Calculates the simple moving average of the last 'n' periods.
   * Formula: MA = (P_t + P_{t-1} + ... + P_{t-n+1}) / n
   * If there are fewer than 'n' data points, averages whatever is available.
   */
  calculateMovingAverage: function(revenues, periods) {
    const N = revenues.length;
    if (N === 0) return 0;

    // Determine how many periods we can actually average
    const limit = Math.min(N, periods);
    let sum = 0;

    // Loop backwards from the last element to sum up the recent months
    for (let i = N - 1; i >= N - limit; i--) {
      sum += revenues[i];
    }

    return Number((sum / limit).toFixed(2));
  },

  /**
   * Fits a straight line (y = mx + c) to historical monthly revenues 
   * using the Ordinary Least Squares (OLS) Linear Regression method.
   * 
   * Formulas:
   * Slope (m) = [ N * Σ(x * y) - Σ(x) * Σ(y) ] / [ N * Σ(x²) - (Σ(x))² ]
   * Intercept (c) = [ Σ(y) - m * Σ(x) ] / N
   * 
   * Forecast for next index (N): y = m * N + c
   */
  calculateLinearRegression: function(revenues) {
    const N = revenues.length;

    // We need at least 2 data points to calculate a trendline
    if (N < 2) {
      return {
        slope: 0,
        intercept: revenues[0] || 0,
        forecast: revenues[0] || 0
      };
    }

    let sumX = 0;       // Sum of month indices (0, 1, 2...)
    let sumY = 0;       // Sum of revenues
    let sumXY = 0;      // Sum of (month index * revenue)
    let sumXX = 0;      // Sum of squared month indices

    for (let x = 0; x < N; x++) {
      const y = revenues[x];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    // Apply the OLS slope formula
    const numerator = (N * sumXY) - (sumX * sumY);
    const denominator = (N * sumXX) - (sumX * sumX);

    let slope = 0;
    // Avoid division by zero
    if (denominator !== 0) {
      slope = numerator / denominator;
    }

    // Apply the OLS intercept formula
    const intercept = (sumY - (slope * sumX)) / N;

    // Project revenue for the next month (index N)
    const nextIndex = N;
    let forecast = (slope * nextIndex) + intercept;
    
    // Prevent predicting negative sales (which is mathematically possible but business-impossible)
    if (forecast < 0) {
      forecast = 0;
    }

    return {
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(2)),
      forecast: Number(forecast.toFixed(2))
    };
  },

  /**
   * Evaluates business state to generate strategic recommendations.
   * @param {Object} analysis - The results from SalesAnalyzer
   * @param {Object} reg - The regression results
   * @returns {Array} - List of insight strings
   */
  generateInsights: function(analysis, reg) {
    const insights = [];
    
    const summary = analysis.summary;
    const stats = analysis.stats;
    const aggr = analysis.aggregations;

    // Insight 1: Sales Trend Direction
    if (reg.slope > 100) {
      insights.push(`Monthly sales are **growing** strongly at a rate of **₹${reg.slope.toLocaleString("en-IN")}** per month. Continue scaling current operations.`);
    } else if (reg.slope < -100) {
      insights.push(`Warning: Sales show a **downward trend** of **₹${Math.abs(reg.slope).toLocaleString("en-IN")}** per month. Consider investigating regional demand or running promotional campaigns.`);
    } else {
      insights.push("Monthly sales trends are relatively **stable**. Focus on improving customer order sizes to push growth.");
    }

    // Insight 2: Order size variability (Standard Deviation vs Mean ratio)
    // The Coefficient of Variation (CV) = StdDev / Mean
    // High CV (> 0.5) means high variation: a few very large orders skew sales.
    // Low CV (< 0.5) means stable, predictable customer ordering habits.
    const cv = stats.stdDev / stats.mean;
    if (cv > 0.5) {
      insights.push(`High order size volatility detected (Std Dev: **₹${stats.stdDev.toLocaleString("en-IN")}** vs Mean: **₹${stats.mean.toLocaleString("en-IN")}**). The business relies on occasional high-value orders. Diversify your customer outreach.`);
    } else {
      insights.push(`Stable ordering patterns detected (Std Dev: **₹${stats.stdDev.toLocaleString("en-IN")}** vs Mean: **₹${stats.mean.toLocaleString("en-IN")}**). Customer order sizes are highly predictable, which supports standard inventory planning.`);
    }

    // Insight 3: Top Category Dominance
    // Calculate what percentage the top category contributes to total revenue
    const catLabels = aggr.category.labels;
    const catRevenues = aggr.category.revenues;
    
    if (catLabels.length > 0) {
      // Find the index of the highest revenue category
      let topCatIdx = 0;
      for (let i = 1; i < catRevenues.length; i++) {
        if (catRevenues[i] > catRevenues[topCatIdx]) {
          topCatIdx = i;
        }
      }
      
      const topCatName = catLabels[topCatIdx];
      const topCatRev = catRevenues[topCatIdx];
      const topCatPercent = Number(((topCatRev / summary.totalRevenue) * 100).toFixed(1));

      if (topCatPercent > 40) {
        insights.push(`Category **${topCatName}** is dominant, contributing **${topCatPercent}%** (₹${topCatRev.toLocaleString("en-IN")}) of total revenue. Consider expanding products in other categories to reduce concentration risk.`);
      } else {
        insights.push(`Balanced catalog performance. Your top category **${topCatName}** represents **${topCatPercent}%** of revenue.`);
      }
    }

    // Insight 4: Lowest Region warning
    const regLabels = aggr.region.labels;
    const regRevenues = aggr.region.revenues;

    if (regLabels.length > 0) {
      // Find the lowest region index
      let lowRegIdx = 0;
      for (let i = 1; i < regRevenues.length; i++) {
        if (regRevenues[i] < regRevenues[lowRegIdx]) {
          lowRegIdx = i;
        }
      }

      const lowRegName = regLabels[lowRegIdx];
      const lowRegRev = regRevenues[lowRegIdx];

      insights.push(`The **${lowRegName}** region is your lowest performing territory with **₹${lowRegRev.toLocaleString("en-IN")}** in sales. Investigate local competitor activity or target local advertising.`);
    }

    // Insight 5: Top product volume recommendation
    const prodLabels = aggr.product.labels;
    const prodQtys = aggr.product.quantities; // quantities of top products
    
    if (prodLabels.length > 0) {
      const topProductName = prodLabels[0];
      const topProductQty = prodQtys[0];
      insights.push(`Your top product by revenue is **${topProductName}** (sold **${topProductQty}** units). Double-check stocking levels to ensure zero stockouts during high demand.`);
    }

    return insights;
  }
};
