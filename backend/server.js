// server.js
//
// WHAT THIS CODE DOES:
// This is the main server file for our Full Stack application. It initializes the Express 
// server, opens our connection to MongoDB, configures sessions, registers routes, and hosts our pages.
//
// WHY WE NEED IT:
// Node.js runs as a background process waiting for incoming browser network requests. 
// This file initializes all server configurations and starts listening on a network port.

const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const protectRoute = require("./middleware/authMiddleware.js");
const authRoutes = require("./routes/authRoutes.js");

// Load configuration keys from .env file into 'process.env'
dotenv.config();

// Create our Express application instance
const app = express();

// Open the network connection to MongoDB using Mongoose
connectDB();

// --- MIDDLEWARE CONFIGURATIONS ---

// Body Parsers: Reads incoming JSON data and standard form submissions, 
// parsing them into req.body objects so they are readable in JavaScript.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Express Session middleware
// WHY SESSIONS ARE NEEDED:
// Sessions allow our server to identify logged-in users. When a user logs in, Express 
// stores a session object in memory and writes a signed session ID into the user's browser cookie.
app.use(session({
  secret: process.env.SESSION_SECRET || "default_local_secret_key", // Signs the session ID cookie
  resave: false, // Prevents session from saving to memory if it wasn't modified
  saveUninitialized: false, // Prevents creating a session cookie for unauthenticated visitors
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // Session expires in 2 hours (in milliseconds)
    secure: false, // Set to true if running on HTTPS (not local development)
    httpOnly: true // Prevents frontend JavaScript from reading our cookie, stopping XSS attacks
  }
}));

// --- SERVING STATIC ASSETS ---
// Express static allows the browser to download CSS and JS modules directly.
// We map "/css" URL to "frontend/css" directory, and "/js" URL to "frontend/js" directory.
app.use("/css", express.static(path.join(__dirname, "../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../frontend/js")));

// --- PAGE ROUTING ---

// GET /signup: Serves the registration form page
app.get("/signup", (req, res) => {
  // If the user is already logged in, redirect them directly to the dashboard
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(__dirname, "../frontend/signup.html"));
});

// GET /login: Serves the login form page
app.get("/login", (req, res) => {
  // If the user is already logged in, redirect them directly to the dashboard
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// GET /dashboard: Serves the Sales Analytics & Prediction Dashboard page.
// We pass 'protectRoute' as a middleware. If it fails, the user is redirected to /login.
app.get("/dashboard", protectRoute, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

// GET /: Automatically redirects home traffic to the dashboard (which will redirect to /login if guest)
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// --- REGISTER API ROUTERS ---
// All requests starting with /auth (e.g. /auth/login) are forwarded to authRoutes
app.use("/auth", authRoutes);

// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
