const mongoose = require('mongoose');
const dns = require('dns');

// Override local DNS settings to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsError) {
  console.warn(`[DNS WARNING] Failed to set custom DNS servers: ${dnsError.message}`);
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Database connection error: MONGO_URI is not defined in the .env file');
    process.exit(1);
  }
  
  try {
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

