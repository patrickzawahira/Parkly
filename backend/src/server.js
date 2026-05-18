import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupSocket } from './services/socketService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug: Check if API key is loaded
console.log('🔑 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES ✅' : 'NO ❌');
if (process.env.GEMINI_API_KEY) {
  console.log('   Key starts with:', process.env.GEMINI_API_KEY.substring(0, 20) + '...');
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartparking';

// Create HTTP server for Express + Socket.io
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Logic
setupSocket(io);

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 10000, // 10 seconds
  retryWrites: true,
  w: 'majority'
};

// Connect to DB and Start
mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check if MongoDB is running (local) or accessible (Atlas)');
    console.error('   2. Verify MONGO_URI in your .env file');
    console.error('   3. For MongoDB Atlas: Check IP whitelist and connection string');
    console.error('   4. For local MongoDB: Ensure MongoDB service is running');
    console.error(`\n   Current MONGO_URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.error('\n   To use local MongoDB, set in .env:');
    console.error('   MONGO_URI=mongodb://localhost:27017/smartparking');
    process.exit(1);
  });
