/**
 * ui.js
 * 
 * Why this file exists:
 * It handles DOM manipulation. All code relating to reading input forms, 
 * changing screen views, rendering tables, updating text metrics, and paginating 
 * rows is written here. Keeping DOM updates isolated prevents our math logic 
 * from getting cluttered with button click listeners.
 * 
 * How it works:
 * - We maintain a simple UI state object (like the current page size and page number).
 * - We write small helper functions that locate specific HTML IDs and overwrite 
 *   their contents (innerText or innerHTML) with clean, formatted analytics.
 * - We implement pagination by index slicing: rendering slice(startIndex, endIndex) 
 *   of our filtered records.
 */

window.DashboardUI = {
  // UI Pagination State
  currentPage: 1,
  pageSize: 10,
  filteredDataList: [], // Holds the currently filtered array of records for the table

  /**
   * Toggles the UI view between the welcome screen and the active dashboard.
   * @param {boolean} showActive - True to show dashboard, false to show placeholder
   */
  toggleDashboardView: function(showActive) {
    const placeholder = document.getElementById("dashboard-placeholder");
    const activeView = document.getElementById("dashboard-active");
    const filterSection = document.getElementById("filter-section");
    const btnExport = document.getElementById("btn-export-report");

    if (showActive) {
      placeholder.classList.add("hidden");
      activeView.classList.remove("hidden");
      filterSection.classList.remove("disabled-section");
      btnExport.removeAttribute("disabled");
    } else {
      placeholder.classList.remove("hidden");
      activeView.classList.add("hidden");
      filterSection.classList.add("disabled-section");
      btnExport.setAttribute("disabled", "true");
    }
  },

  /**
   * Populates the Category and Region dropdown menus with unique values found in the dataset.
   * @param {Array} data - The full sales records array
   */
  populateFilterDropdowns: function(data) {
    const categorySelect = document.getElementById("filter-category");
    const regionSelect = document.getElementById("filter-region");

    // 1. Reset dropdown options (keep only the default first option)
    categorySelect.innerHTML = '<option value="ALL">All Categories</option>';
    regionSelect.innerHTML = '<option value="ALL">All Regions</option>';

    // 2. Extract unique values using helper object structures (simulating a Hash Set)
    const uniqueCategories = {};
    const uniqueRegions = {};

    for (let i = 0; i < data.length; i++) {
      uniqueCategories[data[i].category] = true;
      uniqueRegions[data[i].region] = true;
    }

    // 3. Append category options to select menu
    const categories = Object.keys(uniqueCategories).sort();
    for (let i = 0; i < categories.length; i++) {
      const option = document.createElement("option");
      option.value = categories[i];
      option.innerText = categories[i];
      categorySelect.appendChild(option);
    }

    // 4. Append region options to select menu
    const regions = Object.keys(uniqueRegions).sort();
    for (let i = 0; i < regions.length; i++) {
      const option = document.createElement("option");
      option.value = regions[i];
      option.innerText = regions[i];
      regionSelect.appendChild(option);
    }
  },

  /**
   * Resets all filter form elements to their default settings.
   */
  resetFilterInputs: function() {
    document.getElementById("filter-start-date").value = "";
    document.getElementById("filter-end-date").value = "";
    document.getElementById("filter-category").value = "ALL";
    document.getElementById("filter-region").value = "ALL";
    document.getElementById("filter-search").value = "";
  },

  /**
   * Gathers active inputs from all filter fields and filters the dataset.
   * @param {Array} originalData - Full array of sanitized sales objects
   * @returns {Array} - Filtered subset of sales records
   */
  getFilteredData: function(originalData) {
    const startDateVal = document.getElementById("filter-start-date").value;
    const endDateVal = document.getElementById("filter-end-date").value;
    const categoryVal = document.getElementById("filter-category").value;
    const regionVal = document.getElementById("filter-region").value;
    const searchVal = document.getElementById("filter-search").value.toLowerCase().trim();

    const filtered = [];

    // O(N) Linear scan to filter records based on criteria
    for (let i = 0; i < originalData.length; i++) {
      const row = originalData[i];

      // Filter A: Date Range
      if (startDateVal && row.date < startDateVal) continue;
      if (endDateVal && row.date > endDateVal) continue;

      // Filter B: Product Category
      if (categoryVal !== "ALL" && row.category !== categoryVal) continue;

      // Filter C: Region
      if (regionVal !== "ALL" && row.region !== regionVal) continue;

      // Filter D: Text Search (Searches product names or customer IDs)
      if (searchVal) {
        const productNameMatches = row.product.toLowerCase().includes(searchVal);
        const customerMatches = row.customer.toLowerCase().includes(searchVal);
        if (!productNameMatches && !customerMatches) continue;
      }

      // If record passed all filters, add to output list
      filtered.push(row);
    }

    return filtered;
  },

  /**
   * Updates all KPI text cards on the dashboard.
   * @param {Object} summary - Summary object from SalesAnalyzer.analyze()
   */
  updateKPICards: function(summary) {
    document.getElementById("kpi-total-revenue").innerText = "₹" + summary.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("kpi-total-orders").innerText = summary.totalOrders.toLocaleString("en-IN");
    document.getElementById("kpi-total-profit").innerText = "₹" + summary.totalProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("kpi-avg-order-value").innerText = "₹" + summary.avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  /**
   * Updates prediction cards and renders business recommendations.
   */
  updatePredictionsPanel: function(forecastResults) {
    // 1. Update numeric calculations
    document.getElementById("forecast-ma").innerText = "₹" + forecastResults.movingAverage.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    document.getElementById("forecast-linear").innerText = "₹" + forecastResults.linearTrend.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    // 2. Adjust regression trend badges (green for growing, red for declining)
    const directionBadge = document.getElementById("forecast-linear-direction");
    directionBadge.className = "trend-badge"; // Reset classes

    if (forecastResults.direction === "UP") {
      directionBadge.classList.add("badge-positive");
      directionBadge.innerText = "▲ Growth";
    } else if (forecastResults.direction === "DOWN") {
      directionBadge.classList.add("badge-negative");
      directionBadge.innerText = "▼ Decline";
    } else {
      directionBadge.classList.add("badge-neutral");
      directionBadge.innerText = "Stable";
    }

    // 3. Clear and render dynamic insights list items
    const insightsList = document.getElementById("insights-list");
    insightsList.innerHTML = ""; // Clear placeholders

    for (let i = 0; i < forecastResults.insights.length; i++) {
      const li = document.createElement("li");
      
      // We use innerHTML because our insights contain **bold tags** for styling key metrics.
      // Since we generate these strings locally in predictor.js, it is safe from XSS.
      li.innerHTML = forecastResults.insights[i]
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Convert markdown **bold** to HTML strong
        
      insightsList.appendChild(li);
    }
  },

  /**
   * Initializes pagination metrics and renders the first page of the data table.
   * @param {Array} data - Filtered list of transactions
   */
  initDataTable: function(data) {
    this.filteredDataList = data;
    this.currentPage = 1;
    this.renderTablePage();
  },

  /**
   * Slices the active dataset and renders the HTML table rows for the current page.
   */
  renderTablePage: function() {
    const tableBody = document.getElementById("table-body");
    const totalRecords = this.filteredDataList.length;

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;

    // Bounds checking: ensure current page is within range
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // 1. Calculate slice boundaries
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalRecords);

    // 2. Clear out older rows
    tableBody.innerHTML = "";

    // 3. Populate rows
    if (totalRecords === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No records found matching filters.</td></tr>';
    } else {
      for (let i = startIndex; i < endIndex; i++) {
        const row = this.filteredDataList[i];
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${this.formatDateToDMY(row.date)}</td>
          <td>${row.customer}</td>
          <td>${row.product}</td>
          <td>${row.category}</td>
          <td>${row.region}</td>
          <td class="text-right">${row.quantity}</td>
          <td class="text-right">₹${row.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="text-right">₹${row.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="text-right">₹${row.profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        `;
        tableBody.appendChild(tr);
      }
    }

    // 4. Update UI labels and controls
    document.getElementById("pagination-info").innerText = `Page ${this.currentPage} of ${totalPages}`;

    // Enable or disable pagination buttons based on position
    document.getElementById("btn-prev-page").disabled = (this.currentPage === 1);
    document.getElementById("btn-next-page").disabled = (this.currentPage === totalPages);
  },

  /**
   * Applies the theme settings (colors & icons) to the DOM.
   * @param {boolean} isDarkMode - True to apply dark mode, false for light
   */
  applyTheme: function(isDarkMode) {
    const sunIcon = document.getElementById("icon-sun");
    const moonIcon = document.getElementById("icon-moon");

    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      document.body.classList.remove("dark-mode");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  },

  /**
   * Formats a YYYY-MM-DD date string to DD/MM/YYYY format.
   * @param {string} dateString - e.g. "2025-01-02"
   * @returns {string} - e.g. "02/01/2025"
   */
  formatDateToDMY: function(dateString) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }
    return dateString;
  }
};
