/**
 * app.js
 * 
 * Why this file exists:
 * It is the orchestrator and entry point of our application. It listens for 
 * browser events (button clicks, file uploads, key presses in filter boxes, 
 * page loads) and directs the other modules (Storage, Parser, Analyzer, Predictor, 
 * Charts, UI) on what actions to take.
 * 
 * How it works:
 * - On `DOMContentLoaded`, it initializes the page (loads stored data, sets default themes).
 * - It keeps a simple global state object (`AppStore`) to track uploaded data.
 * - It defines a unified `refreshDashboard()` function that runs calculations, 
 *   feeds outputs to the charts engine, and writes text to the DOM.
 * - It implements file reading using the HTML5 `FileReader` API and exports text 
 *   reports using standard browser `Blob` files.
 */

// 1. Define global application state store
window.AppStore = {
  rawCSVString: "",
  salesRecords: [],     // The full array of clean transactions
  filteredRecords: [],  // The subset of records matching active filters
  isDarkMode: false
};

// 2. Main execution triggers when DOM is fully loaded by the browser
document.addEventListener("DOMContentLoaded", function() {
  AppController.init();
});

const AppController = {
  
  /**
   * Initializes application state, theme, and registers all user action listeners.
   */
  init: function() {
    this.initTheme();
    this.bindEvents();
  },

  /**
   * Restores user theme preference from LocalStorage or system default.
   */
  initTheme: function() {
    const savedTheme = StorageHelper.getTheme();
    
    // Check if user set dark mode, or defaults to dark if they prefer it at the system level
    if (savedTheme === "dark") {
      AppStore.isDarkMode = true;
    } else if (savedTheme === "light") {
      AppStore.isDarkMode = false;
    } else {
      // Browser environment feature detection: check system preference
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      AppStore.isDarkMode = prefersDark;
    }
    
    DashboardUI.applyTheme(AppStore.isDarkMode);
  },



  /**
   * Registers all DOM event listeners for interactivity.
   */
  bindEvents: function() {
    const self = this; // Maintain reference to this controller context

    // --- CSV UPLOAD EVENT HANDLERS ---
    const fileInput = document.getElementById("csv-file-input");
    const dropZone = document.getElementById("drop-zone");

    // Standard File Selection
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        self.handleCSVFile(file);
      }
    });

    // Drag-and-Drop Visual States
    dropZone.addEventListener("dragover", function(e) {
      e.preventDefault(); // Required to allow dropping files!
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

    // --- SAMPLE DATA LOAD EVENT HANDLERS ---
    const btnLoadSample = document.getElementById("btn-load-sample");
    const btnPlaceholderSample = document.getElementById("btn-placeholder-sample");

    const loadSampleHandler = function() {
      // 1. Generate ~500 rows programmatically
      const csvContent = SampleDataGenerator.generateCSV();
      // 2. Parse the generated CSV string
      const parsedRecords = CSVParser.parse(csvContent);

      if (parsedRecords && parsedRecords.length > 0) {
        // Update store
        AppStore.salesRecords = parsedRecords;
        AppStore.filteredRecords = parsedRecords;

        // Reset filter inputs
        DashboardUI.resetFilterInputs();

        // Update view state
        DashboardUI.toggleDashboardView(true);
        DashboardUI.populateFilterDropdowns(parsedRecords);



        self.calculateAndRefreshDashboard();
      }
    };

    btnLoadSample.addEventListener("click", loadSampleHandler);
    btnPlaceholderSample.addEventListener("click", loadSampleHandler);

    // --- FILTER INTERACTION EVENT HANDLERS ---
    const filterFields = [
      document.getElementById("filter-start-date"),
      document.getElementById("filter-end-date"),
      document.getElementById("filter-category"),
      document.getElementById("filter-region")
    ];

    // Trigger filters on selection changes
    for (let i = 0; i < filterFields.length; i++) {
      filterFields[i].addEventListener("change", function() {
        self.applyUIFilters();
      });
    }

    // Trigger filters dynamically on search text input (typing)
    document.getElementById("filter-search").addEventListener("input", function() {
      self.applyUIFilters();
    });

    // Reset Filters Button
    document.getElementById("btn-reset-filters").addEventListener("click", function() {
      DashboardUI.resetFilterInputs();
      self.applyUIFilters();
    });

    // --- PAGINATION CLICK HANDLERS ---
    document.getElementById("btn-prev-page").addEventListener("click", function() {
      DashboardUI.currentPage--;
      DashboardUI.renderTablePage();
    });

    document.getElementById("btn-next-page").addEventListener("click", function() {
      DashboardUI.currentPage++;
      DashboardUI.renderTablePage();
    });

    // --- THEME SWITCH HANDLER ---
    document.getElementById("btn-theme-toggle").addEventListener("click", function() {
      AppStore.isDarkMode = !AppStore.isDarkMode;
      
      // Apply theme CSS to DOM
      DashboardUI.applyTheme(AppStore.isDarkMode);
      
      // Save user preference
      StorageHelper.saveTheme(AppStore.isDarkMode ? "dark" : "light");

      // Redraw active charts using updated theme font/grid colors
      if (AppStore.salesRecords.length > 0) {
        self.calculateAndRefreshDashboard();
      }
    });

    // --- EXPORT REPORT BUTTON HANDLER ---
    document.getElementById("btn-export-report").addEventListener("click", function() {
      self.exportPerformanceReport();
    });
  },

  /**
   * Helper that reads a selected File object, parses it, and updates application state.
   * @param {File} file - Browser file object
   */
  handleCSVFile: function(file) {
    const self = this;
    
    // Check file extension
    if (!file.name.endsWith(".csv")) {
      alert("Error: Invalid file format. Please upload a .csv file.");
      return;
    }

    // HTML5 FileReader to read the file contents asynchronously
    const reader = new FileReader();
    
    // Triggered when file reading completes successfully
    reader.onload = function(e) {
      const csvText = e.target.result;
      const parsedRecords = CSVParser.parse(csvText);

      if (parsedRecords && parsedRecords.length > 0) {
        // Save to store
        AppStore.salesRecords = parsedRecords;
        AppStore.filteredRecords = parsedRecords;

        // Reset any existing filters in the UI
        DashboardUI.resetFilterInputs();

        // Update dashboard view
        DashboardUI.toggleDashboardView(true);
        DashboardUI.populateFilterDropdowns(parsedRecords);

        // Process figures and display
        self.calculateAndRefreshDashboard();
      } else {
        alert("Error: CSV parsing failed. Please verify that headers and row data are correct.");
      }
    };

    // Triggered if the file read fails
    reader.onerror = function() {
      alert("Error: Reading file from disk failed.");
    };

    // Begin reading the file as raw UTF-8 string text
    reader.readAsText(file);
  },

  /**
   * Retrieves active filters, updates filtered dataset array, and refreshes the screen.
   */
  applyUIFilters: function() {
    AppStore.filteredRecords = DashboardUI.getFilteredData(AppStore.salesRecords);
    
    // Reset table pagination back to page 1 whenever filters change
    DashboardUI.currentPage = 1;
    
    this.calculateAndRefreshDashboard();
  },

  /**
   * Core orchestrator that pulls data, triggers calculations, updates charts, 
   * and populates text fields in the DOM.
   */
  calculateAndRefreshDashboard: function() {
    const data = AppStore.filteredRecords;

    // 1. Math Aggregation Phase
    const analysisResults = SalesAnalyzer.analyze(data);

    if (!analysisResults) {
      // Fallback: If filtered list is completely empty
      DashboardUI.updateKPICards({ totalOrders: 0, totalRevenue: 0, totalProfit: 0, avgOrderValue: 0 });
      DashboardCharts.destroyAll();
      DashboardUI.initDataTable([]);
      
      const insightsList = document.getElementById("insights-list");
      insightsList.innerHTML = "<li>No active data matches your filters. Please expand your query.</li>";
      return;
    }

    // 2. Trend Prediction Phase
    const forecastResults = SalesPredictor.generateForecastsAndInsights(analysisResults);

    // 3. UI Update Phase
    // Update KPI panels
    DashboardUI.updateKPICards(analysisResults.summary);
    
    // Update linear projection and business guidelines
    DashboardUI.updatePredictionsPanel(forecastResults);

    // Re-draw graphs
    DashboardCharts.renderAll(analysisResults.aggregations, AppStore.isDarkMode);

    // Re-draw paginated data table
    DashboardUI.initDataTable(data);
  },

  /**
   * Generates a text Performance Report and triggers browser download.
   */
  exportPerformanceReport: function() {
    const data = AppStore.filteredRecords;
    const analysis = SalesAnalyzer.analyze(data);
    
    if (!analysis) return;
    
    const forecasts = SalesPredictor.generateForecastsAndInsights(analysis);

    // Construct markdown-formatted performance report
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

    report += `III. ALGORITHMIC FORECASTS (NEXT MONTH)\n`;
    report += `--------------------------------------\n`;
    report += `3-Month Moving Average Projection : ₹${forecasts.movingAverage.toLocaleString("en-IN")}\n`;
    report += `OLS Linear Trend Line Projection  : ₹${forecasts.linearTrend.toLocaleString("en-IN")}\n`;
    report += `Monthly Trend Slope Vector        : ₹${forecasts.slope.toLocaleString("en-IN")} / month (Direction: ${forecasts.direction})\n\n`;

    report += `IV. BUSINESS INTELLIGENCE INSIGHTS\n`;
    report += `----------------------------------\n`;
    for (let i = 0; i < forecasts.insights.length; i++) {
      // Strip markdown asterisks for plain text report cleanliness
      const cleanInsight = forecasts.insights[i].replace(/\*\*/g, "");
      report += `${i + 1}. ${cleanInsight}\n`;
    }
    
    report += `\n==================================================\n`;
    report += `End of Analytics Report.\n`;

    // Create a Blob containing our report text
    // A Blob represents a raw file-like object of immutable data
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    
    // Create an invisible anchor element to trigger download link
    const downloadAnchor = document.createElement("a");
    
    // Convert Blob to object URL reference
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `Sales_Performance_Report_${new Date().toISOString().slice(0,10)}.txt`;
    
    // Programmatically trigger a click on the anchor tag
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // Cleanup: remove temporary element and URL reference
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadAnchor.href);
  }
};
