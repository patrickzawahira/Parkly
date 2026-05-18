import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'spot_owner'], default: 'user' },
  licensePlate: { type: String, default: '' },
  personalInfo: {
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  paymentMethods: [{
    type: { type: String, enum: ['card', 'paypal', 'apple_pay', 'google_pay'], default: 'card' },
    last4: String, // Last 4 digits of card
    brand: String, // Card brand (Visa, Mastercard, etc.)
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: { type: Boolean, default: false }
  }],
  preferences: {
    defaultVehicle: String,
    accessibility: {
      highContrast: { type: Boolean, default: false },
      largeText: { type: Boolean, default: false },
      voiceGuidance: { type: Boolean, default: false }
    },
    app: {
      notifications: { type: Boolean, default: true },
      darkMode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
    }
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active'],
    default: 'none'
  }
}, { timestamps: true });

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// --- Parking Spot Schema ---
const spotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  pricePerHour: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  totalSpots: { type: Number, default: 1 },
  availableSpots: { type: Number, default: 1 },
  features: [String], // e.g. "EV Charging", "Disabled"
  restrictions: {
    timeLimit: Number, // in minutes
    disabledOnly: { type: Boolean, default: false }
  },
  providerId: String
}, { timestamps: true });

spotSchema.index({ location: '2dsphere' });

// --- Reservation Schema ---
const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Spot', required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  status: { type: String, enum: ['pending', 'en_route', 'active', 'completed', 'cancelled'], default: 'active' },
  totalPrice: Number,
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, { timestamps: true });

// --- Chat Schema ---
const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Spot = mongoose.model('Spot', spotSchema);
export const Reservation = mongoose.model('Reservation', reservationSchema);
export const Chat = mongoose.model('Chat', chatSchema);
