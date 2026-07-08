// middleware/authMiddleware.js
//
// WHAT THIS CODE DOES:
// This middleware protects our private pages (like the dashboard) from unauthorized guests.
// It checks if the visitor has a valid session before letting them proceed.
//
// WHY WE NEED IT:
// Anyone can type "http://localhost:3000/dashboard" into their browser URL bar. 
// Without middleware, they could access the dashboard directly. This code acts as a security gatekeeper.
//
// WHAT next() DOES:
// next() is a function provided by Express. When called, it tells Express to pass control 
// to the next middleware or route handler in line. If we don't call next(), the request will hang, 
// and the browser will load indefinitely.

const protectRoute = (req, res, next) => {
  // Check if session exists and contains our saved userId key
  if (req.session && req.session.userId) {
    // User is logged in! Call next() to allow them to load the requested page
    return next();
  }

  // User is not logged in! Redirect them back to the login page
  res.redirect("/login");
};

// Export the middleware so we can apply it to private routes in server.js
module.exports = protectRoute;
