export interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
  occupancy: number; // 0-100 percentage
  totalSpots: number;
  availableSpots: number;
  distance: number; // in miles
  type: 'Garage' | 'Street' | 'Lot';
  features: string[]; // e.g., "EV Charging", "Disabled", "Covered"
  coordinates: { x: number; y: number }; // Simulation coordinates (0-100 scale)
}

export interface UserProfile {
  name: string;
  email: string;
  licensePlate: string;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    voiceGuidance: boolean;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum AppRoute {
  LOGIN = '/login',
  HOME = '/',
  DETAILS = '/details/:id',
  NAVIGATION = '/navigate/:id',
  ANALYTICS = '/analytics',
  SETTINGS = '/settings',
}