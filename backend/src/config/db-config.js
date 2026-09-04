import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  try {
    await mongoose.connect(mongoURI);
    console.log("DB connected");
  } catch (err) {
    console.error("Unable to connect: ", err);
    process.exit(1);
  }
}