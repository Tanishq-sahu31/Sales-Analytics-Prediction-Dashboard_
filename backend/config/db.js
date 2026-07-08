// config/db.js
//
// WHAT THIS CODE DOES:
// This file connects our Node.js server to the MongoDB database using Mongoose.
//
// WHY WE NEED IT:
// A database is essential for storing user accounts. If we stored user data in a 
// standard JavaScript array in server memory, all accounts would be lost every time 
// the server restarted. A database stores data permanently on the system hard drive.
//
// WHY COMPANIES USE IT:
// - MongoDB is a popular NoSQL database that saves data as JSON-like documents. This makes 
//   it extremely fast and easy to pair with JavaScript.
// - Mongoose is an Object Data Modeling (ODM) library. It acts as an easy-to-use bridge, 
//   allowing us to write JavaScript code to interact with MongoDB instead of writing raw database commands.

const mongoose = require("mongoose");

// This function connects to the MongoDB server using the URI key in our .env file.
// We make it an async function because establishing a network connection to a database 
// takes time, and we must await its completion.
const connectDB = async () => {
  try {
    // Retrieve our secret connection link from the environment variables
    const dbURI = process.env.MONGO_URI;

    // Trigger the connection. await pauses this function until the connection succeeds.
    const conn = await mongoose.connect(dbURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If MongoDB is not running or the connection link is invalid, this catch block runs.
    console.error(`Database connection error: ${error.message}`);
    
    // process.exit(1) terminates our Node.js server process. 
    // The "1" code indicates that the server shut down due to a critical error.
    process.exit(1);
  }
};

// Export the function so we can call it in our main server.js file
module.exports = connectDB;
