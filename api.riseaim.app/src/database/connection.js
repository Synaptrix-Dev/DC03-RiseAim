import mongoose from "mongoose";

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.DATABASE);

    isConnected = true;
    console.log(
      " ============== 📦 Connected to RiseAim Database"
    );
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

export default connectToDB;
