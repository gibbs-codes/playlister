import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();  

const dbURI = `mongodb://${process.env.MONGO_HOST}:27017/upcomingShows`;


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