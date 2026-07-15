const mongoose = require('mongoose');

// Connects to MongoDB on startup; exits the process if the connection fails
// since the app cannot function without a database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;