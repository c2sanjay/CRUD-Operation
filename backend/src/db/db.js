const mongoose = require("mongoose");

async function connectDatabase() {
  const mongodbUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_cart";

  await mongoose.connect(mongodbUri);
  console.log("Connected to MongoDB");
}

module.exports = connectDatabase;
