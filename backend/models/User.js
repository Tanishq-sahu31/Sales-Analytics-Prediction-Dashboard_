// models/User.js
//
// WHAT THIS CODE DOES:
// This file defines the Mongoose Schema (blueprint) for our "Users" collection in MongoDB.
// It also contains a hook that automatically encrypts (hashes) the user's password before saving it.
//
// WHY WE NEED IT:
// In database systems, we need to define the shape of our documents so the database knows 
// what fields exist and what type of data they hold. Mongoose schemas validate our data fields before writing.
//
// WHY PASSWORD HASHING IS IMPORTANT:
// Plain text passwords must never be stored in a database. If a database is breached, hackers 
// would instantly see everyone's password. Hashing is a one-way mathematical function that turns 
// a password like "myPassword123" into a long, undecipherable string. It cannot be reversed back to plain text.
//
// WHY BCRYPTJS IS USED:
// bcryptjs is a secure algorithm designed specifically for hashing passwords. It adds a "salt" (random data) 
// and makes database matching secure, making it extremely difficult for hackers to crack.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the blueprint for our User document
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true // Removes any accidental trailing or leading spaces
  },
  email: {
    type: String,
    required: true,
    unique: true, // Prevents two accounts from registering with the same email
    trim: true,
    lowercase: true // Converts email to lowercase to prevent duplicates like Test@test.com vs test@test.com
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now // Automatically sets the date to the current time when created
  }
});

// A Mongoose Hook: This code runs automatically BEFORE Mongoose saves a document to the database.
// We use a regular function here (not an arrow function) because we need 'this' to refer to the user document.
userSchema.pre("save", async function(next) {
  const user = this;

  // Only hash the password if it has been modified (or is newly created)
  if (!user.isModified("password")) {
    return next(); // Skip hashing and go to the next step
  }

  try {
    // 10 salt rounds is a standard security level that balances speed and safety
    const saltRounds = 10;
    
    // Generate the salt (random characters added to the password to make it unique)
    const salt = await bcrypt.genSalt(saltRounds);

    // Hash the password using the generated salt
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Replace the plain text password with our newly encrypted hash
    user.password = hashedPassword;

    // next() tells Mongoose that our middleware processing is done, and it can proceed to save the document
    next();
  } catch (error) {
    // If anything fails, pass the error to next() so Mongoose knows to halt the operation
    next(error);
  }
});

// Create the model class. MongoDB will automatically create a collection called "users" (lowercase plural)
const User = mongoose.model("User", userSchema);

module.exports = User;
