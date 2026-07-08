// app.js
// Main controller that links the store, parsing, UI, and charts together.
// It sets up global states and orchestrates events (like filters or uploads).

// Central state store
window.AppStore = {
  salesRecords: [],     // Raw parsed sales objects
  filteredRecords: [],  // Subset of sales after filters are applied
  isDarkMode: false     // Flag to track dark/light theme state
};

const AppController = {
  
  // Set up theme and register event listeners
  init: function() {
    this.initTheme();
    this.bindEvents();
  },

  // Read saved theme selection from storage (or browser preferences)
  initTheme: function() {
    const savedTheme = StorageHelper.getTheme();
    
    if (savedTheme === "dark") {
      AppStore.isDarkMode = true;
    } else if (savedTheme === "light") {
      AppStore.isDarkMode = false;
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      AppStore.isDarkMode = prefersDark;
    }
    
    DashboardUI.applyTheme(AppStore.isDarkMode);
  },

  // Register event listeners on buttons, inputs, and files
  bindEvents: function() {
    const self = this;

    const fileInput = document.getElementById("csv-file-input");
    const dropZone = document.getElementById("drop-zone");

    // File input selection
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        self.handleCSVFile(file);
      }
    });

    // Drag and drop events
    dropZone.addEventListener("dragover", function(e) {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", function() {
      dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", function(e) {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      
      const file = e.dataTransfer.files[0];
      if (file) {
        self.handleCSVFile(file);
      }
    });

    // Load sample data buttons
    const btnLoadSample = document.getElementById("btn-load-sample");
    const btnPlaceholderSample = document.getElementById("btn-placeholder-sample");

    const loadSampleHandler = function() {
      const csvContent = SampleDataGenerator.generateCSV();
      const parsedRecords = CSVParser.parse(csvContent);

      if (parsedRecords && parsedRecords.length > 0) {
        AppStore.salesRecords = parsedRecords;
        AppStore.filteredRecords = parsedRecords;

        DashboardUI.resetFilterInputs();
        
        DashboardUI.toggleDashboardView(true);
        DashboardUI.populateFilterDropdowns(parsedRecords);

        self.calculateAndRefreshDashboard();
      }
    };

    btnLoadSample.addEventListener("click", loadSampleHandler);
    btnPlaceholderSample.addEventListener("click", loadSampleHandler);

    // Filters array change listeners
    const filterFields = [
      document.getElementById("filter-start-date"),
      document.getElementById("filter-end-date"),
      document.getElementById("filter-category"),
      document.getElementById("filter-region"),
      document.getElementById("filter-search")
    ];

    const filterChangeHandler = function() {
      if (AppStore.salesRecords.length > 0) {
        // Query filtered subset of data
        AppStore.filteredRecords = DashboardUI.getFilteredDataset(AppStore.salesRecords);
        self.calculateAndRefreshDashboard();
      }
    };

    for (let i = 0; i < filterFields.length; i++) {
      if (filterFields[i].tagName === "INPUT") {
        filterFields[i].addEventListener("input", filterChangeHandler);
      } else {
        filterFields[i].addEventListener("change", filterChangeHandler);
      }
    }

    // Reset filters button
    document.getElementById("btn-reset-filters").addEventListener("click", function() {
      if (AppStore.salesRecords.length > 0) {
        DashboardUI.resetFilterInputs();
        AppStore.filteredRecords = AppStore.salesRecords;
        self.calculateAndRefreshDashboard();
      }
    });

    // Theme toggle button click
    document.getElementById("btn-theme-toggle").addEventListener("click", function() {
      AppStore.isDarkMode = !AppStore.isDarkMode;
      DashboardUI.applyTheme(AppStore.isDarkMode);
      StorageHelper.saveTheme(AppStore.isDarkMode ? "dark" : "light");

      if (AppStore.salesRecords.length > 0) {
        self.calculateAndRefreshDashboard();
      }
    });

    // Export report click
    document.getElementById("btn-export-report").addEventListener("click", function() {
      self.exportPerformanceReport();
    });
  },

  // Reads CSV file, parses it, and populates dashboard
  handleCSVFile: function(file) {
    const self = this;
    
    if (!file.name.endsWith(".csv")) {
      alert("Error: Invalid file format. Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
      const csvText = e.target.result;
      const parsedRecords = CSVParser.parse(csvText);

      if (parsedRecords && parsedRecords.length > 0) {
        AppStore.salesRecords = parsedRecords;
        AppStore.filteredRecords = parsedRecords;

        DashboardUI.resetFilterInputs();

        DashboardUI.toggleDashboardView(true);
        DashboardUI.populateFilterDropdowns(parsedRecords);

        self.calculateAndRefreshDashboard();
      } else {
        alert("Error: CSV parsing failed. Please verify that headers and row data are correct.");
      }
    };

    reader.onerror = function() {
      alert("Error: Reading file from disk failed.");
    };

    reader.readAsText(file);
  },

  // Recalculates metrics, rebuilds charts, and populates data table
  calculateAndRefreshDashboard: function() {
    const data = AppStore.filteredRecords;

    // Enable export report button if we have records
    document.getElementById("btn-export-report").disabled = (data.length === 0);

    // Calculate core statistics
    const analysisResults = SalesAnalyzer.analyze(data);

    if (!analysisResults) {
      // Clear chart instances and show empty table states
      DashboardCharts.destroyAll();
      const tableBody = document.getElementById("table-body");
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No records found.</td></tr>';
      
      const insightsList = document.getElementById("insights-list");
      insightsList.innerHTML = "<li>No active data matches your filters. Please expand your query.</li>";
      return;
    }

    // Generate forecasts and recommendations
    const forecastResults = SalesPredictor.generateForecastsAndInsights(analysisResults);

    // Render KPI metrics and predictions
    DashboardUI.updateKPICards(analysisResults.summary);
    DashboardUI.updatePredictionsPanel(forecastResults);

    // Redraw charts and populate table rows
    DashboardCharts.renderAll(analysisResults.aggregations, AppStore.isDarkMode);
    DashboardUI.initDataTable(data);
  },

  // Generates and downloads plain text analysis report
  exportPerformanceReport: function() {
    const data = AppStore.filteredRecords;
    const analysis = SalesAnalyzer.analyze(data);
    
    if (!analysis) return;
    
    const forecasts = SalesPredictor.generateForecastsAndInsights(analysis);

    let report = `==================================================\n`;
    report += `SALES PERFORMANCE & PREDICTION REPORT\n`;
    report += `Generated on: ${new Date().toLocaleDateString()}\n`;
    report += `==================================================\n\n`;

    report += `I. PERFORMANCE METRICS SUMMARY\n`;
    report += `------------------------------\n`;
    report += `Total Sales Revenue : ₹${analysis.summary.totalRevenue.toLocaleString("en-IN")}\n`;
    report += `Total Orders Closed : ${analysis.summary.totalOrders.toLocaleString("en-IN")}\n`;
    report += `Total Net Profit    : ₹${analysis.summary.totalProfit.toLocaleString("en-IN")}\n`;
    report += `Average Order Value : ₹${analysis.summary.avgOrderValue.toLocaleString("en-IN")}\n\n`;

    report += `II. DESCRIPTIVE MATHEMATICAL STATISTICS\n`;
    report += `---------------------------------------\n`;
    report += `Arithmetic Mean     : ₹${analysis.stats.mean.toLocaleString("en-IN")}\n`;
    report += `Median Order Value  : ₹${analysis.stats.median.toLocaleString("en-IN")}\n`;
    report += `Mode (Order Qty)    : ${analysis.stats.mode}\n`;
    report += `Variance            : ${analysis.stats.variance.toLocaleString("en-IN")}\n`;
    report += `Standard Deviation  : ₹${analysis.stats.stdDev.toLocaleString("en-IN")}\n\n`;

    report += `III. SALES TREND FORECASTS (NEXT MONTH)\n`;
    report += `---------------------------------------\n`;
    report += `3-Month Moving Average Projection : ₹${forecasts.movingAverage.toLocaleString("en-IN")}\n`;
    report += `Linear Trend Line Projection      : ₹${forecasts.linearTrend.toLocaleString("en-IN")}\n`;
    report += `Average Monthly Sales Growth Rate : ₹${forecasts.slope.toLocaleString("en-IN")} / month (Direction: ${forecasts.direction})\n\n`;

    report += `IV. BUSINESS INTELLIGENCE INSIGHTS\n`;
    report += `----------------------------------\n`;
    for (let i = 0; i < forecasts.insights.length; i++) {
      const cleanInsight = forecasts.insights[i].replace(/\*\*/g, "");
      report += `${i + 1}. ${cleanInsight}\n`;
    }
    
    report += `\n==================================================\n`;
    report += `End of Analytics Report.\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const downloadAnchor = document.createElement("a");
    
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `Sales_Performance_Report_${new Date().toISOString().slice(0,10)}.txt`;
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadAnchor.href);
  }
};

// Initialize app when window scripts complete loading
window.addEventListener("DOMContentLoaded", function() {
  AppController.init();
});
