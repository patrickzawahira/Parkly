import React from 'react';
import { ParkingSpot } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface SimulatedMapProps {
  spots: ParkingSpot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const SimulatedMap: React.FC<SimulatedMapProps> = ({ spots, selectedId, onSelect }) => {
  return (
    <div className="relative w-full h-full bg-slate-200 overflow-hidden rounded-xl shadow-inner border border-slate-300">
      {/* Map Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Simulated Roads */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <path d="M 0 50 Q 50 20 100 50" stroke="white" strokeWidth="8" fill="none" />
        <path d="M 30 0 L 30 100" stroke="white" strokeWidth="8" fill="none" />
        <path d="M 70 0 L 70 100" stroke="white" strokeWidth="8" fill="none" />
        <path d="M 0 80 L 100 80" stroke="white" strokeWidth="8" fill="none" />
      </svg>

      {/* User Location */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse flex items-center justify-center">
            <Navigation size={12} className="text-white fill-current" />
        </div>
      </div>

      {/* Parking Pins */}
      {spots.map((spot) => {
        const isSelected = selectedId === spot.id;
        const colorClass = spot.availableSpots > 5 
            ? 'text-green-600' 
            : spot.availableSpots > 0 
                ? 'text-yellow-600' 
                : 'text-red-600';

        return (
          <button
            key={spot.id}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(spot.id);
            }}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 z-20 hover:scale-110 active:scale-95`}
            style={{ left: `${spot.coordinates.x}%`, top: `${spot.coordinates.y}%` }}
          >
            <div className={`relative flex flex-col items-center ${isSelected ? 'scale-125 z-30' : ''}`}>
               {/* Price Tag Bubble */}
               <div className={`mb-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}>
                    ${spot.pricePerHour}
               </div>
               
               {/* Pin Icon */}
               <MapPin 
                className={`drop-shadow-md ${isSelected ? 'text-blue-600 fill-blue-100' : colorClass} ${isSelected ? 'w-10 h-10' : 'w-8 h-8'}`} 
                fill="currentColor"
               />
            </div>
          </button>
        );
      })}
    </div>
  );
};