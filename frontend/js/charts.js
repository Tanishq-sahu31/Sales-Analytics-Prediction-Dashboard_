// charts.js
// Handles rendering and updating the four Chart.js graphs on the dashboard.
// We keep references of active charts so we can destroy them before drawing new ones.

window.DashboardCharts = {
  // Store active chart objects
  instances: {
    salesTrend: null,
    category: null,
    products: null,
    region: null
  },

  // Color schemes
  themeColors: {
    blue: "#2563eb",
    blueMuted: "rgba(37, 99, 235, 0.15)",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f59e0b",
    red: "#ef4444",
    
    // Light mode labels
    textLight: "#4b5563",
    gridLight: "#e5e7eb",

    // Dark mode labels
    textDark: "#94a3b8",
    gridDark: "#334155"
  },

  // Redraws all graphs using updated data and active theme preferences
  renderAll: function(aggregations, isDarkMode) {
    this.destroyAll(); // Clear old configurations first to prevent overlap issues

    const textColor = isDarkMode ? this.themeColors.textDark : this.themeColors.textLight;
    const gridColor = isDarkMode ? this.themeColors.gridDark : this.themeColors.gridLight;

    this.renderSalesTrendChart(aggregations.monthly, textColor, gridColor);
    this.renderCategoryChart(aggregations.category, isDarkMode);
    this.renderProductsChart(aggregations.product, textColor, gridColor);
    this.renderRegionChart(aggregations.region, textColor, gridColor);
  },

  // Destroys active charts to clean up canvas event listeners
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

  // Line Chart: revenue and profit over months
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
            fill: true,
            tension: 0.3,
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
                return "₹" + value.toLocaleString("en-IN");
              }
            }
          }
        }
      }
    });
  },

  // Doughnut Chart: sales splits by category
  renderCategoryChart: function(data, isDarkMode) {
    const ctx = document.getElementById("chart-category").getContext("2d");
    const textColor = isDarkMode ? this.themeColors.textDark : this.themeColors.textLight;

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
          borderColor: isDarkMode ? "#1e293b" : "#ffffff"
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

  // Vertical Bar Chart: Top 5 products by revenue
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
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
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

  // Horizontal Bar Chart: sales split by regions
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
        indexAxis: "y", // makes it horizontal bar chart
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
