const mongoose = require('mongoose');

// Connect to MongoDB using the URI from environment variables.
// Exits the process with a clear message if the connection fails,
// because the API cannot work without a database.
async function connectDB(mongodbUri) {
  try {
    await mongoose.connect(mongodbUri);
    console.log('[MongoDB] connected');
  } catch (err) {
    console.error(`[MongoDB] connection failed: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
