const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI =
    process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error(
      "MONGO_URI is missing in .env"
    );
  }

  await mongoose.connect(mongoURI);

  console.log(
    "MongoDB connected successfully"
  );
}

module.exports = connectDB;