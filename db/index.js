import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();  

const dbURI = process.env.MONGO_HOST

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err; 
  }
};


export default connectDB;