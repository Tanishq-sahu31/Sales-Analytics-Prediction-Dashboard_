# Sales Analytics & Prediction Dashboard

A modern, clean, and professional business intelligence dashboard built entirely on the frontend using **Vanilla JavaScript (ES6)**, **HTML5**, and **CSS3**. This application processes thousands of transaction records, computes descriptive mathematical statistics, visualizes sales distributions, and calculates linear regression forecasts.

**Built with zero backend dependencies.** Everything runs directly in the client browser.

---

## 📂 Project Folder Structure

The project follows a modular, single-responsibility architecture to demonstrate clean software design principles:

```text
/
├── index.html               # Main page layout & structural DOM anchors
├── styles.css               # Design system, CSS variables, grids, and dark mode theme rules
└── js/
    ├── app.js               # Orchestrator: binds event listeners and directs pipeline flow
    ├── sampleData.js        # Data builder: generates a realistic 500-row CSV sales dataset
    ├── parser.js            # CSV handler: integrates PapaParse and performs sanitization
    ├── storage.js           # Storage driver: reads/writes JSON data to localStorage
    ├── analyzer.js          # Math engine: implements sums, averages, and statistics manually
    ├── predictor.js         # Forecasting engine: implements moving average and linear regression
    ├── charts.js            # Graph controller: handles Chart.js configurations and theme paint refreshes
    └── ui.js                # View controller: handles HTML pagination, tables, and filters
```

---

## ⚡ Quick Start (How to Run)

Since this project has **no backend servers or build steps**, launching it is simple:

1. **Clone or Download** the folder contents to your computer.
2. **Double-click `index.html`** to open the dashboard directly in any browser (Chrome, Safari, Firefox, Edge).
3. Alternatively, you can serve it using simple local servers:
   - Python: `python -m http.server 8000`
   - VS Code extension: **Live Server**
4. Click **"Load Sample Data"** on the header or placeholder card to populate the dashboard instantly with ~500 transactions, or upload your own compatible `.csv` file.

---

## 📊 Core Features

- **Dynamic Landing Page**: Responsive welcome screen that prompts users to upload a spreadsheet or load mock data.
- **Drag-and-Drop Uploader**: Direct drag-and-drop CSV parser using standard browser file inputs.
- **Responsive Dashboard Grid**: Four key performance indicator (KPI) metric cards:
  - **Total Revenue**
  - **Total Orders**
  - **Total Profit**
  - **Average Order Value (AOV)**
- **Filter and Search Engine**: Real-time filtering by Date range, Product Category, Region, and customer search query.
- **Interactive Visual Graphs (Chart.js)**:
  - Area Chart: Chronological revenue and profit trendline.
  - Doughnut Chart: Sales split by product category.
  - Vertical Bar Chart: Top 5 performing products.
  - Horizontal Bar Chart: Sales breakdown by territory.
- **Mathematical Statistics Panel**: Descriptive statistics calculations built from scratch.
- **Predictive Sales Forecasting**:
  - **Moving Average Model**: Calculates a smoothed 3-month forecast.
  - **Ordinary Least Squares (OLS) Linear Trend Model**: Forecasts next month's sales by plotting a linear regression trajectory.
- **Actionable Business Insights**: Dynamic list of written advice analyzing catalog dominance, regional underperformance, and standard deviation trends.
- **Browser Persistence**: Restores uploaded databases and theme configurations automatically upon reloading.
- **Performance Report Export**: Downloads a detailed, localized plain-text analysis report of calculated metrics.

---

## 🧮 Mathematical Formulas Implemented

To showcase algorithmic implementation skills, all calculations are coded manually in `js/analyzer.js` and `js/predictor.js`:

### 1. Arithmetic Mean (Average)
Calculates the center size of a transaction.
$$\text{Mean} = \frac{\sum_{i=1}^{N} x_i}{N}$$
*Where $x_i$ represents individual order revenues and $N$ represents the total count of transactions.*

### 2. Median (Middle Value)
Finds the midpoint of transaction revenues. Sorts the values and selects the center element. It is robust against outliers:
- If $N$ is **odd**: 
  $$\text{Median} = \text{Value at index } \left\lfloor \frac{N}{2} \right\rfloor$$
- If $N$ is **even**: 
  $$\text{Median} = \frac{\text{Value at index } \left(\frac{N}{2} - 1\right) + \text{Value at index } \left(\frac{N}{2}\right)}{2}$$

### 3. Mode (Most Frequent)
Iterates through quantities ordered using a hash frequency map to discover the most common purchase volume.

### 4. Variance ($\sigma^2$)
Measures the average of the squared deviations from the Mean, showing the spread of transaction values.
$$\text{Variance } (\sigma^2) = \frac{\sum_{i=1}^{N} (x_i - \text{Mean})^2}{N}$$

### 5. Standard Deviation ($\sigma$)
Measures the standard distance of transactions from the average. Expressed in rupees.
$$\text{Standard Deviation } (\sigma) = \sqrt{\text{Variance}}$$

### 6. Ordinary Least Squares (OLS) Linear Regression Trend
Calculates the best-fit line ($y = mx + c$) to predict the next month's sales ($y$) where the month indices are $x = [0, 1, 2...N-1]$.
- **Slope ($m$)**:
  $$m = \frac{N\sum(xy) - \sum x\sum y}{N\sum(x^2) - \left(\sum x\right)^2}$$
- **Intercept ($c$)**:
  $$c = \frac{\sum y - m\sum x}{N}$$
- **Forecast**: Evaluates the equation at the next chronological index ($x = N$):
  $$\text{Forecast} = m \cdot N + c$$

---

## 🎯 Interview Cheat Sheet (Q&A Prep)

Here are the questions a tech recruiter or frontend architect will likely ask about this project:

### 1. JavaScript (ES6) Questions
*   **Q: Why didn't you use ES modules (`import`/`export`) for this project?**
    *   **A**: Native ES6 modules trigger CORS errors if files are loaded using the `file://` protocol directly from a local folder. By loading scripts sequentially in `index.html`, we attach namespaces to the global `window` object. This makes the project double-click runnable directly from file explorer, which is highly accessible for demo reviews.
*   **Q: Explain how the browser-native `FileReader` works.**
    *   **A**: `FileReader` runs asynchronously. We instantiate `new FileReader()`, register a callback function on `.onload`, and call `.readAsText(file)`. The browser reads the file on a background thread. When complete, it pushes the parsing task onto the JavaScript event loop task queue, preventing the main browser window from freezing during heavy file uploads.
*   **Q: What is the purpose of `Object.keys()` in your codebase?**
    *   **A**: `Object.keys(obj)` takes a JavaScript object and returns a linear array of its property name keys. We use this to loop through column headers, list active chart instances, and extract unique keys from our maps.
*   **Q: How did you implement Indian numbering formatting (Lakhs & Crores) for currencies?**
    *   **A**: We used the built-in JavaScript Internationalization API method `number.toLocaleString('en-IN')`. By default, standard formatters group values by 3 digits (e.g. `150,000`). Using the `'en-IN'` locale parameter tells the browser's formatting engine to group values according to the Indian system (grouping by 3 digits for thousands, and then by 2 digits for lakhs and crores: e.g. `1,50,000`).

### 2. Data Structures & Algorithms (DSA) Questions
*   **Q: How do you extract unique filter items (like Categories and Regions) efficiently?**
    *   **A**: We loop through all records and add them as keys to a hash map object: `uniqueSet[row.category] = true`. Key-lookups and insertions in hash maps take $O(1)$ constant time. After scanning the database in $O(N)$ linear time, we extract the unique list with `Object.keys()`. This is significantly faster than checking if a value exists in a flat array, which would result in an inefficient $O(N^2)$ algorithm.
*   **Q: What is the time complexity of your statistical calculations?**
    *   **A**: 
        - Mean, Mode, Variance, and Regression calculations take **$O(N)$ (Linear Time)** since they traverse the records array exactly once.
        - Median takes **$O(N \log N)$ (Linearithmic Time)** because it requires sorting the array of numbers.
*   **Q: Why did you clone the array before sorting it to calculate the Median?**
    *   **A**: In JavaScript, `Array.prototype.sort()` sorts elements *in-place*, which mutates the original array. If we sorted our main sales records list directly, it would destroy the chronological order of our transactions, breaking our charts and linear regression forecasts. We call `values.slice()` first to duplicate the array elements in memory before sorting.

### 3. Web Performance & Rendering Questions
*   **Q: Why did you build a paginated data table instead of rendering all 500 rows?**
    *   **A**: Rendering hundreds of rows directly creates thousands of DOM tree nodes. The browser must calculate layout geometries, compute CSS rules, and paint pixels for all of them, which slows down the browser and causes input lag. Paginating the table ensures only 10 rows are rendered at a time, keeping DOM operations fast and memory overhead low.
*   **Q: Why does Chart.js require a destroy step in your codebase?**
    *   **A**: Chart.js binds a controller instance to the HTML `<canvas>` element. If you attempt to draw a new chart over an existing one, both event-loop listeners remain active. When you hover your mouse, the two charts alternate visual states, causing flickering. Calling `.destroy()` on the active chart object cleans up its memory allocation and event listeners.

---

## 🚀 Future Scope (TODOs / Expansion Ideas)

These placeholders represent features you can add to take this project to the next level:
1. **[TODO] Database Integration**: Replace LocalStorage with a cloud backend like Node.js/Express and MongoDB to support multi-user login and cloud syncing.
2. **[TODO] Excel Import (.xlsx)**: Integrate libraries like SheetJS to allow importing binary Microsoft Excel files in addition to standard CSVs.
3. **[TODO] PDF Export**: Add standard client-side PDF generation (e.g. using `html2pdf.js`) to let users download formatted visual PDF executive summaries.
4. **[TODO] Multi-Variable Forecasting**: Extend the prediction engine to use triple exponential smoothing (Holt-Winters method) to predict seasonal sales variations.
