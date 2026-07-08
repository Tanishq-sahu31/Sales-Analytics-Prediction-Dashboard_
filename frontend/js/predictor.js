// predictor.js
// Handles next month's sales projections and builds text recommendations.
// We use two methods:
// 1. Moving Average: average of the last 3 months of sales.
// 2. Linear Trend Line: a line of best fit (y = mx + c) using standard coordinate geometry.

window.SalesPredictor = {

  // Generates forecasts and business recommendations based on analyzer results
  generateForecastsAndInsights: function(analysis) {
    if (!analysis) return null;

    const monthlyData = analysis.aggregations.monthly;
    const monthlyRevenues = monthlyData.revenues;
    
    // Calculate simple moving average
    const movingAverageForecast = this.calculateMovingAverage(monthlyRevenues, 3);

    // Calculate linear trend line
    const trendResult = this.calculateLinearTrend(monthlyRevenues);

    // Generate insights list
    const insights = this.generateInsights(analysis, trendResult);

    return {
      movingAverage: movingAverageForecast,
      linearTrend: trendResult.forecast,
      slope: trendResult.slope,
      direction: trendResult.slope > 0 ? "UP" : (trendResult.slope < 0 ? "DOWN" : "FLAT"),
      insights: insights
    };
  },

  // Averages the last 'n' months of sales
  calculateMovingAverage: function(revenues, periods) {
    const N = revenues.length;
    if (N === 0) return 0;

    const limit = Math.min(N, periods);
    let sum = 0;

    // Sum last few months backwards
    for (let i = N - 1; i >= N - limit; i--) {
      sum += revenues[i];
    }

    return Number((sum / limit).toFixed(2));
  },

  // Finds the line of best fit (y = mx + c) using monthly sales data
  // x = month indices (0, 1, 2...)
  // y = revenue values
  // Formula for Slope (m) = [ N * sum(xy) - sum(x) * sum(y) ] / [ N * sum(x^2) - (sum(x))^2 ]
  // Formula for Intercept (c) = [ sum(y) - m * sum(x) ] / N
  calculateLinearTrend: function(revenues) {
    const N = revenues.length;

    // Need at least 2 months to draw a trend line
    if (N < 2) {
      return {
        slope: 0,
        intercept: revenues[0] || 0,
        forecast: revenues[0] || 0
      };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let x = 0; x < N; x++) {
      const y = revenues[x];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const numerator = (N * sumXY) - (sumX * sumY);
    const denominator = (N * sumXX) - (sumX * sumX);

    let slope = 0;
    if (denominator !== 0) {
      slope = numerator / denominator;
    }

    const intercept = (sumY - (slope * sumX)) / N;

    // Predict sales for the next month index (N)
    const nextIndex = N;
    let forecast = (slope * nextIndex) + intercept;
    
    // Prevent negative projections
    if (forecast < 0) {
      forecast = 0;
    }

    return {
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(2)),
      forecast: Number(forecast.toFixed(2))
    };
  },

  // Generates practical business recommendations by reviewing dashboard aggregates
  generateInsights: function(analysis, trend) {
    const insights = [];
    
    const summary = analysis.summary;
    const stats = analysis.stats;
    const aggr = analysis.aggregations;

    // 1. Sales Trend Direction
    if (trend.slope > 100) {
      insights.push(`Monthly sales are **growing** strongly at a rate of **₹${trend.slope.toLocaleString("en-IN")}** per month. Continue scaling current operations.`);
    } else if (trend.slope < -100) {
      insights.push(`Warning: Sales show a **downward trend** of **₹${Math.abs(trend.slope).toLocaleString("en-IN")}** per month. Consider investigating regional demand or running promotional campaigns.`);
    } else {
      insights.push("Monthly sales trends are relatively **stable**. Focus on improving customer order sizes to push growth.");
    }

    // 2. Volatility (Standard Deviation vs Mean ratio)
    const cv = stats.stdDev / stats.mean;
    if (cv > 0.5) {
      insights.push(`High order size volatility detected (Std Dev: **₹${stats.stdDev.toLocaleString("en-IN")}** vs Mean: **₹${stats.mean.toLocaleString("en-IN")}**). The business relies on occasional high-value orders. Diversify your customer outreach.`);
    } else {
      insights.push(`Stable ordering patterns detected (Std Dev: **₹${stats.stdDev.toLocaleString("en-IN")}** vs Mean: **₹${stats.mean.toLocaleString("en-IN")}**). Customer order sizes are highly predictable, which supports standard inventory planning.`);
    }

    // 3. Category Dominance (concentration risk)
    const catLabels = aggr.category.labels;
    const catRevenues = aggr.category.revenues;
    
    if (catLabels.length > 0) {
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

    // 4. Underperforming regions
    const regLabels = aggr.region.labels;
    const regRevenues = aggr.region.revenues;

    if (regLabels.length > 0) {
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

    // 5. Stock Level suggestions
    const prodLabels = aggr.product.labels;
    const prodQtys = aggr.product.quantities;
    
    if (prodLabels.length > 0) {
      const topProductName = prodLabels[0];
      const topProductQty = prodQtys[0];
      insights.push(`Your top product by revenue is **${topProductName}** (sold **${topProductQty}** units). Double-check stocking levels to ensure zero stockouts during high demand.`);
    }

    return insights;
  }
};
