const app = require('./app');
const connectDB = require('./config/db');

// Entry point: connect to MongoDB, then start listening for HTTP requests
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
