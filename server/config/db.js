const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the connection string in MONGO_URI.
 * The process exits if the connection cannot be established, since the
 * API is useless without a database.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "MONGO_URI is not set. Add it to your .env file before starting the server."
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
