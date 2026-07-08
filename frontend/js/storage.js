// storage.js
// Saves and loads preferences in the browser using LocalStorage.
// We use this to save the theme preference (light vs dark mode) when the user refreshes.

window.StorageHelper = {
  
  // Storage keys
  KEYS: {
    THEME: "sales_dashboard_theme",
    SALES_DATA: "sales_dashboard_records" // kept for reference, though sales records auto-load is disabled
  },

  // Saves theme selection ("dark" or "light")
  saveTheme: function(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  },

  // Reads the saved theme selection
  getTheme: function() {
    try {
      return localStorage.getItem(this.KEYS.THEME);
    } catch (e) {
      console.warn("Could not read theme preference:", e);
      return null;
    }
  },

  // Saves sales data to storage
  saveSalesData: function(data) {
    try {
      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.KEYS.SALES_DATA, jsonString);
      return true;
    } catch (e) {
      console.error("LocalStorage save failed:", e);
      return false;
    }
  },

  // Reads sales data from storage
  getSalesData: function() {
    try {
      const jsonString = localStorage.getItem(this.KEYS.SALES_DATA);
      if (!jsonString) return null;
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("LocalStorage parse failed:", e);
      return null;
    }
  },

  // Clears sales data from storage
  clearSalesData: function() {
    try {
      localStorage.removeItem(this.KEYS.SALES_DATA);
    } catch (e) {
      console.error("LocalStorage clear failed:", e);
    }
  }
};
