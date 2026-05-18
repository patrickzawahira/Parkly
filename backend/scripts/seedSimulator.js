import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Spot } from '../src/models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartparking';

// Seed four primary garage/lot locations (example coordinates in the US)
const SAMPLE_SPOTS = [
  {
    name: 'Downtown Central Garage',
    address: '101 Main St, San Francisco, CA',
    location: { coordinates: [-122.4011, 37.7891] }, // [lng, lat]
    pricePerHour: 5,
    totalSpots: 200,
    availableSpots: 30,
    features: ['Covered', 'Disabled', 'Security Camera'],
  },
  {
    name: 'Market Square Lot',
    address: '45 Market Ave, San Francisco, CA',
    location: { coordinates: [-122.3967, 37.7938] },
    pricePerHour: 3.5,
    totalSpots: 50,
    availableSpots: 30,
    features: ['EV Charging', 'Open 24/7'],
  },
  {
    name: 'Library Street Parking',
    address: 'Library Ln, San Francisco, CA',
    location: { coordinates: [-122.4047, 37.7814] },
    pricePerHour: 2,
    totalSpots: 20,
    availableSpots: 1,
    features: ['Time Limit: 2h'],
  },
  {
    name: 'Tech Park Visitor',
    address: '88 Innovation Dr, San Francisco, CA',
    location: { coordinates: [-122.4072, 37.7985] },
    pricePerHour: 0,
    totalSpots: 100,
    availableSpots: 90,
    features: ['EV Charging', 'Disabled', 'Free'],
  },
];

const runSimulation = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected for Simulation');

  // Seed if empty
  if (await Spot.countDocuments() === 0) {
    await Spot.insertMany(SAMPLE_SPOTS);
    console.log('Seeded initial spots');
  }

  console.log('Starting Simulation Loop...');
  
  // Simulation Loop
  setInterval(async () => {
    const spots = await Spot.find();
    const randomSpot = spots[Math.floor(Math.random() * spots.length)];
    
    // Randomly change availability
    const change = Math.random() > 0.5 ? 1 : -1;
    let newCount = randomSpot.availableSpots + change;
    newCount = Math.max(0, Math.min(newCount, randomSpot.totalSpots));
    
    if (newCount !== randomSpot.availableSpots) {
        randomSpot.availableSpots = newCount;
        randomSpot.status = newCount === 0 ? 'occupied' : 'available';
        await randomSpot.save();
        console.log(`[SIMULATOR] ${randomSpot.name} updated: ${newCount} spots left.`);
        
        // Note: To emit socket events, this script would need to connect to the running server via socket-client 
        // or share the io instance if run within the same process.
    }
  }, 3000); // Every 3 seconds
};

runSimulation();

