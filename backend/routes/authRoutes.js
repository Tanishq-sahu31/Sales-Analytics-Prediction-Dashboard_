// routes/authRoutes.js
//
// WHAT THIS CODE DOES:
// This file handles HTTP requests for user registration (signup), login, and logout.
//
// WHY WE NEED IT:
// Express uses routing to map separate URL endpoints to separate backend logic. 
// When a user submits a form on the frontend, this code receives the data and queries MongoDB.
//
// WHY SESSIONS ARE USED:
// HTTP is "stateless"—the server forgets who you are the second it finishes sending the HTML. 
// Sessions solve this. The server creates a unique session block in memory and gives the browser 
// a small cookie containing a "session ID". The browser sends this cookie with every request, 
// allowing Express to identify which logged-in user is loading the page.

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// POST /auth/signup
// WHAT THE REQUEST CONTAINS:
// req.body contains form inputs: username, email, password.
// WHAT THE RESPONSE CONTAINS:
// Redirects the browser to "/login" on success, or "/signup?error=..." on failure.
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation: Make sure no inputs are empty
    if (!username || !email || !password) {
      return res.redirect("/signup?error=Please fill in all fields");
    }

    // 2. Check if the email already exists in our database
    // User.findOne queries MongoDB to look for a document with the matching email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // If a user is found, stop and redirect back to signup with an error message
      return res.redirect("/signup?error=Email already registered");
    }

    // 3. Create a new user instance
    // (Mongoose pre-save hook in User.js will automatically hash the password using bcryptjs)
    const newUser = new User({
      username: username,
      email: email,
      password: password
    });

    // 4. Save the user document into MongoDB
    await newUser.save();

    // 5. Successful registration! Redirect the user to the login screen
    res.redirect("/login?success=Account created! Please log in.");
  } catch (error) {
    console.error("Signup error:", error);
    res.redirect("/signup?error=Something went wrong. Please try again.");
  }
});

// POST /auth/login
// WHAT THE REQUEST CONTAINS:
// req.body contains email and password.
// WHAT THE RESPONSE CONTAINS:
// Redirects to "/dashboard" on success, or "/login?error=..." on failure.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs are not empty
    if (!email || !password) {
      return res.redirect("/login?error=Please enter email and password");
    }

    // 2. Search MongoDB for a user with the matching email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Security tip: We use a generic error message so hackers don't know 
      // if the email is correct or wrong.
      return res.redirect("/login?error=Invalid email or password");
    }

    // 3. Compare the submitted plain text password with the hashed password in our database.
    // bcrypt.compare() hashes the input password using the salt stored in the hash and checks 
    // if the resulting string matches exactly.
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.redirect("/login?error=Invalid email or password");
    }

    // 4. Authentication success! Store user details inside the Express session.
    // Express-session automatically updates our cookie and connects it to this user.
    req.session.userId = user._id;
    req.session.username = user.username;

    // 5. Redirect the logged-in user to their protected dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/login?error=Something went wrong. Please try again.");
  }
});

// GET /auth/logout
// WHAT THE REQUEST CONTAINS:
// A standard GET request from a logout link click.
// WHAT THE RESPONSE CONTAINS:
// Redirects the browser to "/login".
router.get("/logout", (req, res) => {
  // Destroy the active session on the server side
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout session destroy failed:", err);
      return res.redirect("/dashboard?error=Logout failed");
    }
    
    // Clear the session cookie from the user's browser
    res.clearCookie("connect.sid"); // "connect.sid" is the default cookie name for express-session
    
    // Redirect back to login screen
    res.redirect("/login?success=You have logged out.");
  });
});

// Export the router so it can be registered in server.js
module.exports = router;
