export interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
  occupancy: number;
  totalSpots: number;
  availableSpots: number;
  distance: number;
  type: 'Garage' | 'Street' | 'Lot';
  features: string[];
  location: { lat: number; lng: number };
  imageUrl?: string;
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

export type ParkingReceiptStatus = 'pending' | 'en_route' | 'active' | 'completed' | 'expired' | 'cancelled';

export interface ParkingReceipt {
  id: string;
  spotId: string;
  spotName: string;
  address: string;
  pricePerHour: number;
  durationMinutes: number;
  totalPaid: number;
  startTime: string;
  endTime: string;
  status: ParkingReceiptStatus;
}