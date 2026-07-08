// ui.js
// Handles all page rendering, table updates, dropdown mapping, and views.
// Keeps DOM updates separated from math equations.

window.DashboardUI = {
  // Page index settings for pagination
  currentPage: 1,
  pageSize: 10,
  filteredDataList: [],

  // Switches between welcome card and dashboard view
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

  // Fills Category and Region dropdowns with unique options from the uploaded database
  populateFilterDropdowns: function(data) {
    const categorySelect = document.getElementById("filter-category");
    const regionSelect = document.getElementById("filter-region");

    categorySelect.innerHTML = '<option value="ALL">All Categories</option>';
    regionSelect.innerHTML = '<option value="ALL">All Regions</option>';

    // Loop through records to find unique values
    const uniqueCategories = {};
    const uniqueRegions = {};

    for (let i = 0; i < data.length; i++) {
      uniqueCategories[data[i].category] = true;
      uniqueRegions[data[i].region] = true;
    }

    // Populate Category dropdown
    const categories = Object.keys(uniqueCategories).sort();
    for (let i = 0; i < categories.length; i++) {
      const option = document.createElement("option");
      option.value = categories[i];
      option.innerText = categories[i];
      categorySelect.appendChild(option);
    }

    // Populate Region dropdown
    const regions = Object.keys(uniqueRegions).sort();
    for (let i = 0; i < regions.length; i++) {
      const option = document.createElement("option");
      option.value = regions[i];
      option.innerText = regions[i];
      regionSelect.appendChild(option);
    }
  },

  // Clears active values in filter inputs
  resetFilterInputs: function() {
    document.getElementById("filter-start-date").value = "";
    document.getElementById("filter-end-date").value = "";
    document.getElementById("filter-category").value = "ALL";
    document.getElementById("filter-region").value = "ALL";
    document.getElementById("filter-search").value = "";
  },

  // Returns a filtered copy of the transactions array based on active inputs
  getFilteredDataset: function(originalData) {
    const startDateVal = document.getElementById("filter-start-date").value;
    const endDateVal = document.getElementById("filter-end-date").value;
    const categoryVal = document.getElementById("filter-category").value;
    const regionVal = document.getElementById("filter-region").value;
    const searchVal = document.getElementById("filter-search").value.toLowerCase().trim();

    const filtered = [];

    for (let i = 0; i < originalData.length; i++) {
      const row = originalData[i];

      // Date check
      if (startDateVal && row.date < startDateVal) continue;
      if (endDateVal && row.date > endDateVal) continue;

      // Category check
      if (categoryVal !== "ALL" && row.category !== categoryVal) continue;

      // Region check
      if (regionVal !== "ALL" && row.region !== regionVal) continue;

      // Text search check
      if (searchVal) {
        const productNameMatches = row.product.toLowerCase().includes(searchVal);
        const customerMatches = row.customer.toLowerCase().includes(searchVal);
        if (!productNameMatches && !customerMatches) continue;
      }

      filtered.push(row);
    }

    return filtered;
  },

  // Fills KPI statistics cards with localized en-IN values
  updateKPICards: function(summary) {
    document.getElementById("kpi-total-revenue").innerText = "₹" + summary.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("kpi-total-orders").innerText = summary.totalOrders.toLocaleString("en-IN");
    document.getElementById("kpi-total-profit").innerText = "₹" + summary.totalProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById("kpi-avg-order-value").innerText = "₹" + summary.avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Renders the moving average and linear trend predictions, plus recommendations list
  updatePredictionsPanel: function(forecastResults) {
    document.getElementById("forecast-ma").innerText = "₹" + forecastResults.movingAverage.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    document.getElementById("forecast-linear").innerText = "₹" + forecastResults.linearTrend.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const directionBadge = document.getElementById("forecast-linear-direction");
    directionBadge.className = "trend-badge";

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

    const insightsList = document.getElementById("insights-list");
    insightsList.innerHTML = "";

    for (let i = 0; i < forecastResults.insights.length; i++) {
      const li = document.createElement("li");
      li.innerHTML = forecastResults.insights[i].replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      insightsList.appendChild(li);
    }
  },

  // Resets pagination back to page 1 and triggers table drawing
  initDataTable: function(data) {
    this.filteredDataList = data;
    this.currentPage = 1;
    this.renderTablePage();
  },

  // Slices records array and draws HTML table rows for the active page
  renderTablePage: function() {
    const tableBody = document.getElementById("table-body");
    const totalRecords = this.filteredDataList.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;

    // Bounds checking
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalRecords);

    tableBody.innerHTML = "";

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

    // Set page text label
    document.getElementById("pagination-info").innerText = `Page ${this.currentPage} of ${totalPages}`;

    // Enable/disable page buttons
    document.getElementById("btn-prev-page").disabled = (this.currentPage === 1);
    document.getElementById("btn-next-page").disabled = (this.currentPage === totalPages);
  },

  // Switches theme configuration classes on document body
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

  // Helper that formats YYYY-MM-DD back to DD/MM/YYYY for rendering
  formatDateToDMY: function(dateString) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }
    return dateString;
  }
};
