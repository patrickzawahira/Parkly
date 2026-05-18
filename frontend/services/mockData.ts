import { ParkingSpot, UserProfile } from '../types';

export const MOCK_PARKING_SPOTS: ParkingSpot[] = [
  {
    id: '1',
    name: 'Downtown Central Garage',
    address: '101 Main St',
    pricePerHour: 5.00,
    occupancy: 85,
    totalSpots: 200,
    availableSpots: 30,
    distance: 0.4,
    type: 'Garage',
    features: ['Covered', 'Disabled', 'Security Camera'],
    coordinates: { x: 50, y: 50 }
  },
  {
    id: '2',
    name: 'Market Square Lot',
    address: '45 Market Ave',
    pricePerHour: 3.50,
    occupancy: 40,
    totalSpots: 50,
    availableSpots: 30,
    distance: 1.2,
    type: 'Lot',
    features: ['EV Charging', 'Open 24/7'],
    coordinates: { x: 30, y: 70 }
  },
  {
    id: '3',
    name: 'Library Street Parking',
    address: 'Library Ln',
    pricePerHour: 2.00,
    occupancy: 95,
    totalSpots: 20,
    availableSpots: 1,
    distance: 0.8,
    type: 'Street',
    features: ['Time Limit: 2h'],
    coordinates: { x: 70, y: 30 }
  },
  {
    id: '4',
    name: 'Tech Park Visitor',
    address: '88 Innovation Dr',
    pricePerHour: 0.00,
    occupancy: 10,
    totalSpots: 100,
    availableSpots: 90,
    distance: 2.5,
    type: 'Garage',
    features: ['EV Charging', 'Disabled', 'Free'],
    coordinates: { x: 20, y: 20 }
  },
  {
    id: '5',
    name: 'Stadium Overflow',
    address: 'Stadium Way',
    pricePerHour: 10.00,
    occupancy: 5,
    totalSpots: 500,
    availableSpots: 475,
    distance: 3.0,
    type: 'Lot',
    features: ['Event Parking'],
    coordinates: { x: 80, y: 80 }
  }
];

export const MOCK_USER: UserProfile = {
  name: "Alex Driver",
  email: "alex@example.com",
  licensePlate: "ABC-1234",
  accessibility: {
    highContrast: false,
    largeText: false,
    voiceGuidance: true
  }
};

export const PERSONAS = [
  {
    name: "Sarah Commuter",
    role: "Daily Commuter",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    goals: [
      "Find parking quickly near work",
      "Minimize daily costs",
      "Avoid being late to meetings"
    ],
    painPoints: [
      "Full garages during rush hour",
      "Expensive daily rates",
      "Narrow parking spaces"
    ]
  },
  {
    name: "Mike Visitor",
    role: "Tourist / Visitor",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    goals: [
      "Park near tourist attractions",
      "Safe and secure location",
      "Easy payment options"
    ],
    painPoints: [
      "Unfamiliar with the area",
      "Confusing street signs",
      "Fear of towing"
    ]
  }
];