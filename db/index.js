import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();  

const dbURI = 'mongodb+srv://user:pass@projectz.ovb3i.mongodb.net/?retryWrites=true&w=majority&appName=projectz'

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