// parser.js
// Cleans up the CSV data uploaded by the user so it's ready for math calculations.
// We parse the string using PapaParse, then loop through rows to convert types and check for errors.

window.CSVParser = {
  
  // Parses raw CSV text and returns clean row objects
  parse: function(csvText) {
    if (!csvText || typeof csvText !== "string" || csvText.trim() === "") {
      console.error("CSV Parser: Empty input.");
      return null;
    }

    // Call PapaParse. 'header: true' automatically maps the first row headers to keys.
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    if (result.errors && result.errors.length > 0 && result.data.length === 0) {
      console.error("CSV Parser: Parsing failed.", result.errors);
      return null;
    }

    // Pass parsed array to the data cleaner
    return this.cleanData(result.data);
  },

  // Cleans fields, converts string numbers to floats/ints, and validates columns
  cleanData: function(rawRows) {
    const cleanedRows = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const row = {};
      
      // Trim spaces from headers and cell values
      const keys = Object.keys(rawRow);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const cleanKey = key.trim();
        const rawValue = rawRow[key];
        const cleanValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;
        row[cleanKey] = cleanValue;
      }

      // Check for missing data
      if (!row.Date || !row.Customer || !row.Product || !row.Category || 
          !row.Region || !row.Quantity || !row.Price || !row.Revenue || !row.Profit) {
        console.warn(`Row ${i + 1} skipped: Missing values.`);
        continue;
      }

      // Convert text numbers to numeric types
      const quantity = parseInt(row.Quantity, 10);
      const price = parseFloat(row.Price);
      const revenue = parseFloat(row.Revenue);
      const profit = parseFloat(row.Profit);

      // Skip row if number formatting fails
      if (isNaN(quantity) || isNaN(price) || isNaN(revenue) || isNaN(profit)) {
        console.warn(`Row ${i + 1} skipped: Invalid number values.`);
        continue;
      }

      // Support both DD/MM/YYYY and YYYY-MM-DD format, converting to YYYY-MM-DD internally
      let parsedDate = null;
      let dateIsoString = "";

      if (row.Date.includes("/")) {
        const parts = row.Date.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // 0-indexed month
          const year = parseInt(parts[2], 10);
          parsedDate = new Date(year, month, day);
          
          if (!isNaN(parsedDate.getTime())) {
            const padMonth = (month + 1) < 10 ? "0" + (month + 1) : (month + 1);
            const padDay = day < 10 ? "0" + day : day;
            dateIsoString = `${year}-${padMonth}-${padDay}`;
          }
        }
      } else if (row.Date.includes("-")) {
        const parts = row.Date.split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          parsedDate = new Date(year, month, day);
          
          if (!isNaN(parsedDate.getTime())) {
            dateIsoString = row.Date;
          }
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime()) || !dateIsoString) {
        console.warn(`Row ${i + 1} skipped: Invalid date format: ${row.Date}`);
        continue;
      }

      // Map values into a clean data object
      const cleanRecord = {
        date: dateIsoString, // Standard YYYY-MM-DD for easier chronological sorting
        customer: row.Customer,
        product: row.Product,
        category: row.Category,
        region: row.Region,
        quantity: quantity,
        price: price,
        revenue: revenue,
        profit: profit
      };

      cleanedRows.push(cleanRecord);
    }

    console.log(`Cleaned data: ${cleanedRows.length} out of ${rawRows.length} rows.`);
    return cleanedRows;
  }
};
