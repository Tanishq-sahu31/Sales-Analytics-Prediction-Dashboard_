/**
 * charts.js
 * 
 * Why this file exists:
 * It handles the creation and updating of our Chart.js graphs. Canvas rendering 
 * can be messy if not managed properly. This file isolates all visual chart configurations,
 * color schemes, and chart lifecycle states.
 * 
 * How it works:
 * - We store active chart instances in `DashboardCharts.instances`.
 * - Before drawing any chart, we check if an instance already exists. If so, 
 *   we call `.destroy()` on it. This is crucial because Chart.js draws on HTML5 
 *   canvas; overlays will cause flickering if old instances are not cleared.
 * - It uses custom colors matching our CSS theme variables and adjusts text/grid colors 
 *   automatically during dark mode toggles.
 */

window.DashboardCharts = {
  // Store active Chart.js instances so we can update or destroy them later
  instances: {
    salesTrend: null,
    category: null,
    products: null,
    region: null
  },

  // Consistent color palette matching our light/dark CSS styles
  themeColors: {
    blue: "#2563eb",
    blueMuted: "rgba(37, 99, 235, 0.15)",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f59e0b",
    red: "#ef4444",
    
    // Grid and text colors for light mode
    textLight: "#4b5563",
    gridLight: "#e5e7eb",

    // Grid and text colors for dark mode
    textDark: "#94a3b8",
    gridDark: "#334155"
  },

  /**
   * Main entry point to render or re-render all dashboard charts.
   * @param {Object} aggregations - Grouped datasets from SalesAnalyzer.analyze().aggregations
   * @param {boolean} isDarkMode - Current active theme state
   */
  renderAll: function(aggregations, isDarkMode) {
    // 1. Destroy existing charts to prevent canvas ghosting
    this.destroyAll();

    // 2. Select appropriate colors based on theme
    const textColor = isDarkMode ? this.themeColors.textDark : this.themeColors.textLight;
    const gridColor = isDarkMode ? this.themeColors.gridDark : this.themeColors.gridLight;

    // 3. Render each individual chart
    this.renderSalesTrendChart(aggregations.monthly, textColor, gridColor);
    this.renderCategoryChart(aggregations.category, isDarkMode);
    this.renderProductsChart(aggregations.product, textColor, gridColor);
    this.renderRegionChart(aggregations.region, textColor, gridColor);
  },

  /**
   * Destroys all active chart instances to free memory and clear canvas contexts.
   */
  destroyAll: function() {
    const keys = Object.keys(this.instances);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (this.instances[key]) {
        this.instances[key].destroy();
        this.instances[key] = null;
      }
    }
  },

  /**
   * Area/Line Chart: Revenue & Profit Trends over Time
   */
  renderSalesTrendChart: function(data, textColor, gridColor) {
    const ctx = document.getElementById("chart-sales-trend").getContext("2d");

    this.instances.salesTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Revenue",
            data: data.revenues,
            borderColor: this.themeColors.blue,
            backgroundColor: this.themeColors.blueMuted,
            fill: true, // This turns our Line chart into an Area chart!
            tension: 0.3, // Curve smoothness
            borderWidth: 2
          },
          {
            label: "Profit",
            data: data.profits,
            borderColor: this.themeColors.green,
            backgroundColor: "transparent",
            fill: false,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: "Inter", size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "Inter", size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { 
              color: textColor,
              font: { family: "Inter", size: 10 },
              callback: function(value) {
                return "₹" + value.toLocaleString("en-IN"); // Add Rupee sign to values
              }
            }
          }
        }
      }
    });
  },

  /**
   * Doughnut Chart: Revenue by Category
   */
  renderCategoryChart: function(data, isDarkMode) {
    const ctx = document.getElementById("chart-category").getContext("2d");
    const textColor = isDarkMode ? this.themeColors.textDark : this.themeColors.textLight;

    // Use consistent pie slice colors
    const sliceColors = [
      this.themeColors.blue,
      this.themeColors.green,
      this.themeColors.purple,
      this.themeColors.orange
    ];

    this.instances.category = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.revenues,
          backgroundColor: sliceColors,
          borderWidth: isDarkMode ? 2 : 1,
          borderColor: isDarkMode ? "#1e293b" : "#ffffff" // Match page card background
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, font: { family: "Inter", size: 11 } }
          }
        }
      }
    });
  },

  /**
   * Vertical Bar Chart: Top 5 Products by Revenue
   */
  renderProductsChart: function(data, textColor, gridColor) {
    const ctx = document.getElementById("chart-products").getContext("2d");

    this.instances.products = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Revenue (₹)",
          data: data.revenues,
          backgroundColor: this.themeColors.purple,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false } // Hide legend since there's only one dataset
        },
        scales: {
          x: {
            grid: { display: false }, // Hide vertical gridlines for cleaner look
            ticks: { color: textColor, font: { family: "Inter", size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              font: { family: "Inter", size: 10 },
              callback: function(value) { return "₹" + value.toLocaleString("en-IN"); }
            }
          }
        }
      }
    });
  },

  /**
   * Horizontal Bar Chart: Revenue by Region
   */
  renderRegionChart: function(data, textColor, gridColor) {
    const ctx = document.getElementById("chart-region").getContext("2d");

    this.instances.region = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Revenue (₹)",
          data: data.revenues,
          backgroundColor: this.themeColors.orange,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y", // This changes the bar chart from vertical to horizontal!
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              font: { family: "Inter", size: 10 },
              callback: function(value) { return "₹" + value.toLocaleString("en-IN"); }
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: "Inter", size: 10 } }
          }
        }
      }
    });
  }
};
