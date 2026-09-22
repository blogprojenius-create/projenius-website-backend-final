const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing from .env"
      );
    }

    const connection =
      await mongoose.connect(mongoUri);

    console.log(
      "========================================"
    );

    console.log(
      "MongoDB Connected"
    );

    console.log(
      "Database:",
      connection.connection.name
    );

    console.log(
      "Host:",
      connection.connection.host
    );

    console.log(
      "========================================"
    );

    return connection;

  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;