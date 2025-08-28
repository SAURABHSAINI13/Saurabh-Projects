// db.js (or connectDB.js)
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Connect to MongoDB (MONGO_URI should be in your .env file)
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1); // Exit process if connection fails
  }
};
export default connectDB;