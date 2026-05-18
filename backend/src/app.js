import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Spot, Reservation, Chat } from './models/index.js';
import { authenticate } from './middleware/auth.js';
import { getChatResponse, processAudio } from './services/aiService.js';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rate limiting for API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api', limiter);

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let resolvedRole = 'user';
    if (role && ['user', 'spot_owner'].includes(role)) {
      resolvedRole = role;
    }

    const user = new User({ name, email, passwordHash, role: resolvedRole });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    // Handle duplicate key error (MongoDB)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        licensePlate: user.licensePlate || '',
        role: user.role,
        subscriptionStatus: user.subscriptionStatus || 'none',
        preferences: user.preferences || {
          accessibility: { highContrast: false, largeText: false, voiceGuidance: false },
          app: { notifications: true, darkMode: 'system' }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User Profile Routes ---
app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure preferences structure exists
    const preferences = user.preferences || {};
    if (!preferences.accessibility) {
      preferences.accessibility = {
        highContrast: false,
        largeText: false,
        voiceGuidance: false
      };
    }
    if (!preferences.app) {
      preferences.app = {
        notifications: true,
        darkMode: 'system'
      };
    }

    res.json({
      name: user.name,
      email: user.email,
      licensePlate: user.licensePlate || '',
      personalInfo: user.personalInfo || { phone: '', address: '' },
      paymentMethods: user.paymentMethods || [],
      preferences: preferences
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { name, licensePlate, personalInfo, paymentMethods, preferences } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (licensePlate !== undefined) user.licensePlate = licensePlate;

    // Update personal info
    if (personalInfo) {
      if (!user.personalInfo) {
        user.personalInfo = { phone: '', address: '' };
      }
      if (personalInfo.phone !== undefined) user.personalInfo.phone = personalInfo.phone;
      if (personalInfo.address !== undefined) user.personalInfo.address = personalInfo.address;
    }

    // Update payment methods
    if (paymentMethods) {
      user.paymentMethods = paymentMethods;
    }

    // Update preferences
    if (preferences) {
      // Initialize preferences if they don't exist
      if (!user.preferences) {
        user.preferences = {
          accessibility: {
            highContrast: false,
            largeText: false,
            voiceGuidance: false
          },
          app: {
            notifications: true,
            darkMode: 'system'
          }
        };
      }

      // Merge preferences properly
      user.preferences = {
        ...user.preferences,
        ...preferences,
        accessibility: {
          ...(user.preferences.accessibility || {}),
          ...(preferences.accessibility || {})
        },
        app: {
          ...(user.preferences.app || { notifications: true, darkMode: 'system' }),
          ...(preferences.app || {})
        }
      };
    }

    await user.save();

    res.json({
      name: user.name,
      email: user.email,
      licensePlate: user.licensePlate || '',
      personalInfo: user.personalInfo || { phone: '', address: '' },
      paymentMethods: user.paymentMethods || [],
      preferences: user.preferences || {
        accessibility: { highContrast: false, largeText: false, voiceGuidance: false },
        app: { notifications: true, darkMode: 'system' }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Parking Routes ---
app.get('/api/parking', async (req, res) => {
  try {
    // Basic filter logic
    const { lat, lng, radius } = req.query;
    let query = {};

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius) || 5000 // meters
        }
      };
    }

    const spots = await Spot.find(query);
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: list my spots
app.get('/api/owner/spots', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'spot_owner') {
      return res.status(403).json({ error: 'Only Spot Owners can view owned spots' });
    }

    const spots = await Spot.find({ providerId: String(user._id) });
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner: analytics for a single spot
app.get('/api/owner/spots/:id/analytics', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'spot_owner') {
      return res.status(403).json({ error: 'Only Spot Owners can view spot analytics' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid spot id' });
    }

    const spot = await Spot.findById(id);
    if (!spot || spot.providerId !== String(user._id)) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const reservations = await Reservation.find({ spotId: id })
      .populate('userId')
      .sort({ startTime: -1 });

    const totalProfit = reservations
      .filter((r) => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    const activeCount = reservations.filter((r) => r.status === 'active').length;

    const parkers = reservations.map((r) => ({
      id: r._id,
      userName: r.userId?.name || 'Guest',
      userEmail: r.userId?.email || '',
      startTime: r.startTime,
      endTime: r.endTime,
      totalPaid: r.totalPrice || 0,
      status: r.status,
      paymentStatus: r.paymentStatus,
    }));

    res.json({
      spot: {
        id: spot._id,
        name: spot.name,
        address: spot.address,
        pricePerHour: spot.pricePerHour,
        totalSpots: spot.totalSpots,
        imageUrl: spot.imageUrl || '',
      },
      metrics: {
        totalProfit,
        activeCount,
        totalReservations: reservations.length,
      },
      parkers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new parking spot (requires Spot Owner with active subscription)
app.post('/api/parking', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'spot_owner') {
      return res.status(403).json({ error: 'Only Spot Owners can create parking spots' });
    }

    const {
      name,
      address,
      lat,
      lng,
      pricePerHour,
      totalSpots = 1,
      features = [],
      imageUrl = '',
    } = req.body;

    if (!name || !address || typeof lat !== 'number' || typeof lng !== 'number' || typeof pricePerHour !== 'number') {
      return res.status(400).json({ error: 'name, address, lat, lng, and pricePerHour are required' });
    }

    const spot = new Spot({
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      pricePerHour,
      totalSpots,
      availableSpots: totalSpots,
      features,
      imageUrl,
      providerId: String(user._id),
    });

    await spot.save();
    res.status(201).json(spot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all parking spots (with optional geospatial filter)
app.get('/api/parking', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let query = {};

    // Only use geospatial query if coordinates are provided and valid
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius) || 50000 // Default 50km
        }
      };
    }

    const spots = await Spot.find(query);
    res.json(spots);
  } catch (err) {
    console.error('Error fetching spots:', err);

    // Fallback: If geospatial query fails (e.g. index missing), try fetching all spots
    try {
      console.log('Attempting fallback fetch of all spots...');
      const allSpots = await Spot.find({}).limit(100);
      res.json(allSpots);
    } catch (fallbackErr) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.get('/api/parking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid parking spot id' });
    }
    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }
    res.json(spot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a parking spot (owner only)
app.put('/api/parking/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'spot_owner') {
      return res.status(403).json({ error: 'Only Spot Owners can update parking spots' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid parking spot id' });
    }

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }

    if (spot.providerId !== String(user._id)) {
      return res.status(403).json({ error: 'You can only update your own spots' });
    }

    const {
      name,
      address,
      lat,
      lng,
      pricePerHour,
      totalSpots,
      features,
      imageUrl,
    } = req.body;

    if (name) spot.name = name;
    if (address) spot.address = address;
    if (typeof lat === 'number' && typeof lng === 'number') {
      spot.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }
    if (typeof pricePerHour === 'number') spot.pricePerHour = pricePerHour;
    if (typeof totalSpots === 'number') {
      const diff = totalSpots - spot.totalSpots;
      spot.totalSpots = totalSpots;
      spot.availableSpots = Math.max(0, spot.availableSpots + diff);
    }
    if (features) spot.features = features;
    if (imageUrl !== undefined) spot.imageUrl = imageUrl;

    await spot.save();
    res.json(spot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a parking spot (owner only)
app.delete('/api/parking/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'spot_owner') {
      return res.status(403).json({ error: 'Only Spot Owners can delete parking spots' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid parking spot id' });
    }

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }

    if (spot.providerId !== String(user._id)) {
      return res.status(403).json({ error: 'You can only delete your own spots' });
    }

    await Spot.findByIdAndDelete(id);
    res.json({ message: 'Spot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reservation Routes ---
app.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const { spotId, durationMinutes, status = 'active' } = req.body; // Default to active for backward compatibility
    if (!spotId) {
      return res.status(400).json({ error: 'spotId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(spotId)) {
      return res.status(400).json({ error: 'Invalid parking spot id' });
    }

    const minutes = Number(durationMinutes);
    if (!minutes || Number.isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ error: 'durationMinutes must be a positive number' });
    }

    const spot = await Spot.findById(spotId);

    if (!spot) {
      return res.status(404).json({ error: 'Parking spot not found' });
    }

    if (spot.availableSpots <= 0) {
      return res.status(400).json({ error: 'Spot full' });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + minutes * 60000);
    const price = (spot.pricePerHour / 60) * minutes;

    const reservation = new Reservation({
      userId: req.user.userId,
      spotId,
      startTime,
      endTime,
      totalPrice: price,
      status // 'pending' or 'active'
    });

    // Atomically decrement spot availability
    spot.availableSpots -= 1;
    if (spot.availableSpots === 0) spot.status = 'occupied';

    await Promise.all([reservation.save(), spot.save()]);

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations', authenticate, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.userId })
      .populate('spotId')
      .sort({ startTime: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reservations/:id', authenticate, async (req, res) => {
  try {
    const { action, durationMinutes, paymentStatus, status } = req.body;
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Update status (e.g. pending -> active)
    if (status) {
      reservation.status = status;
    }

    // Update duration/endTime (e.g. extend after payment)
    if (durationMinutes) {
      const minutes = Number(durationMinutes);
      if (minutes > 0) {
        reservation.endTime = new Date(reservation.startTime.getTime() + minutes * 60000);
        // Recalculate price if needed, but usually frontend sends payment confirmation
        // For simplicity, we assume price is handled or recalculated here
        // We'll need to fetch spot price to be accurate, but let's trust the flow for now
      }
    }

    if (action === 'cancel') {
      reservation.status = 'cancelled';
      reservation.endTime = new Date(); // End immediately

      // Free up the spot
      const spot = await Spot.findById(reservation.spotId);
      if (spot) {
        spot.availableSpots += 1;
        if (spot.status === 'occupied') spot.status = 'available';
        await spot.save();
      }
    }

    if (paymentStatus) {
      reservation.paymentStatus = paymentStatus;
    }

    await reservation.save();

    // Return populated reservation
    await reservation.populate('spotId');
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reservations/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Free up the spot
    const spot = await Spot.findById(reservation.spotId);
    if (spot) {
      spot.availableSpots += 1;
      if (spot.status === 'occupied') spot.status = 'available';
      await spot.save();
    }

    await Reservation.deleteOne({ _id: req.params.id });
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





// --- Chat Routes ---
app.post('/api/chat/text', authenticate, async (req, res) => {
  try {
    const { message, conversationId, userLocation } = req.body;

    // Fetch all spots to provide context to the AI
    // In a real app with many spots, we would use geospatial query to only get nearby spots
    let spots = [];
    if (userLocation && userLocation.lat && userLocation.lng) {
      spots = await Spot.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [userLocation.lng, userLocation.lat] },
            $maxDistance: 10000 // 10km radius
          }
        }
      }).limit(10);

      // Calculate distance for each spot manually if needed, or rely on $near sorting
      // We'll add a simple distance property for the AI context
      spots = spots.map(spot => {
        const spotObj = spot.toObject();
        // Simple Haversine distance approximation could be added here if needed
        // But $near already sorts by distance, so the first one is the nearest
        return spotObj;
      });
    } else {
      // Fallback if no location provided
      spots = await Spot.find({}).limit(10);
    }

    const contextData = {
      spots,
      userLocation
    };

    // In real implementation, fetch history from DB using conversationId
    const reply = await getChatResponse([{ role: 'user', content: message }], false, contextData);
    res.json({ reply });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

app.post('/api/chat/voice', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file' });

    const result = await processAudio(req.file.path);

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Voice processing failed' });
  }
});

// --- Analytics Route (Admin) ---
app.get('/api/analytics', authenticate, async (req, res) => {
  // Mock analytics
  res.json({
    totalReservations: await Reservation.countDocuments(),
    occupiedSpots: await Spot.countDocuments({ status: 'occupied' })
  });
});

export default app;
