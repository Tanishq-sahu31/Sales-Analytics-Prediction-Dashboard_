/**
 * storage.js
 * 
 * Why this file exists:
 * It handles saving and loading data in the user's browser via LocalStorage.
 * Without this, refreshing the browser would clear all uploaded CSV records 
 * and reset the theme (dark mode) to light.
 * 
 * How it works:
 * It provides simple wrapper functions around `localStorage.setItem` and `getItem`.
 * It includes basic try/catch error handling to handle cases where 
 * local storage is full (QuotaExceededError) or disabled by security configurations.
 */

window.StorageHelper = {
  
  // Storage keys to keep our local storage organized
  KEYS: {
    THEME: "sales_dashboard_theme",
    SALES_DATA: "sales_dashboard_records"
  },

  /**
   * Saves the theme preference (dark or light).
   * @param {string} theme - "dark" or "light"
   */
  saveTheme: function(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (e) {
      console.warn("Could not save theme to LocalStorage:", e);
    }
  },

  /**
   * Retrieves the saved theme preference.
   * @returns {string|null} - "dark", "light", or null if not set
   */
  getTheme: function() {
    try {
      return localStorage.getItem(this.KEYS.THEME);
    } catch (e) {
      console.warn("Could not read theme from LocalStorage:", e);
      return null;
    }
  },

  /**
   * Saves the parsed and cleaned sales records array as a JSON string.
   * @param {Array} data - Array of sales transaction objects
   * @returns {boolean} - True if saved successfully, false otherwise
   */
  saveSalesData: function(data) {
    try {
      // Convert the JavaScript array of objects into a JSON string
      const jsonString = JSON.stringify(data);
      localStorage.setItem(this.KEYS.SALES_DATA, jsonString);
      return true;
    } catch (e) {
      console.error("LocalStorage write failed (it might be full):", e);
      return false;
    }
  },

  /**
   * Retrieves the saved sales records and parses them back into a JS array.
   * @returns {Array|null} - The array of objects, or null if no data exists
   */
  getSalesData: function() {
    try {
      const jsonString = localStorage.getItem(this.KEYS.SALES_DATA);
      
      // If no data exists, return null
      if (!jsonString) {
        return null;
      }
      
      // Convert the JSON string back into a real JavaScript array of objects
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Could not parse sales data from LocalStorage:", e);
      return null;
    }
  },

  /**
   * Removes the saved sales data from LocalStorage.
   */
  clearSalesData: function() {
    try {
      localStorage.removeItem(this.KEYS.SALES_DATA);
    } catch (e) {
      console.error("Could not clear sales data from LocalStorage:", e);
    }
  }
};
