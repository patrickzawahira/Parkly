import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Battery, Accessibility, Navigation, X } from 'lucide-react';
import { ParkingSpot } from '../types';
import { parking } from '../services/api';
import { ParklyLogo } from '../components/ParklyLogo';
import { ParklyMap } from '../components/ParklyMap';

const LEBANON_CENTER = { lat: 33.8889, lng: 35.4944 };

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'EV' | 'DIS' | 'FREE'>('ALL');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Map backend spot shape to frontend ParkingSpot type
  const mapBackendSpot = (spot: any): ParkingSpot => {
    const coordinates = spot.location?.coordinates || [];
    const lng = typeof coordinates[0] === 'number' ? coordinates[0] : 0;
    const lat = typeof coordinates[1] === 'number' ? coordinates[1] : 0;

    return {
      id: spot._id || spot.id,
      name: spot.name || 'Parking Spot',
      address: spot.address || 'Unknown address',
      pricePerHour: spot.pricePerHour ?? 0,
      occupancy:
        typeof spot.totalSpots === 'number' && typeof spot.availableSpots === 'number'
          ? Math.round(
            ((spot.totalSpots - spot.availableSpots) / Math.max(1, spot.totalSpots)) * 100
          )
          : 0,
      totalSpots: spot.totalSpots ?? spot.availableSpots ?? 1,
      availableSpots: spot.availableSpots ?? spot.totalSpots ?? 0,
      // Distance is optional from backend – we can derive or default to 0 for now
      distance: typeof spot.distance === 'number' ? spot.distance : 0,
      type: (spot.type as ParkingSpot['type']) || 'Garage',
      features: Array.isArray(spot.features) ? spot.features : [],
      location: { lat, lng },
      imageUrl: spot.imageUrl || '',
    };
  };

  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (selectedFilter === 'EV') matchesFilter = spot.features.includes('EV Charging');
      if (selectedFilter === 'DIS') matchesFilter = spot.features.includes('Disabled');
      if (selectedFilter === 'FREE') matchesFilter = spot.pricePerHour === 0;

      if (showNearbyOnly && userLocation) {
        // Simple distance check (approximate)
        // 1 deg lat ~ 111km. 0.045 deg ~ 5km
        const latDiff = Math.abs(spot.location.lat - userLocation.lat);
        const lngDiff = Math.abs(spot.location.lng - userLocation.lng);
        if (latDiff > 0.05 || lngDiff > 0.05) return false;
      }

      return matchesSearch && matchesFilter;
    });
  }, [spots, searchTerm, selectedFilter, showNearbyOnly, userLocation]);

  const handleSpotSelect = (id: string) => {
    setSelectedSpotId(id);
  };

  const selectedSpot = spots.find(s => s.id === selectedSpotId);

  useEffect(() => {
    // Get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to Lebanon center if geolocation fails
          setUserLocation(LEBANON_CENTER);
        }
      );
    } else {
      setUserLocation(LEBANON_CENTER);
    }
  }, []);

  // Load spots from backend (fallback to mock data on failure)
  useEffect(() => {
    const loadSpots = async () => {
      try {
        setIsLoading(true);
        setError('');
        // Fetch ALL spots initially so users can see spots created anywhere
        const data = await parking.getAll();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapBackendSpot);
          setSpots(mapped);
        } else {
          setSpots([]);
        }
      } catch (err: any) {
        setError(
          err.message || 'Unable to load live parking data. Please try again later.'
        );
        setSpots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpots();
  }, []);

  return (
    <div className="h-full flex flex-col relative bg-slate-100">
      {/* Search Header */}
      <div className="px-4 pt-4 pb-2 bg-white shadow-sm z-30">
        <div className="flex items-center justify-between mb-4 gap-3">
          <ParklyLogo
            size={44}
            textClassName="text-slate-900"
            subtitle="Smart parking intelligence"
          />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Live city coverage
            </p>
            <p className="text-xs font-medium text-blue-600">Powered by Parkly AI</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 py-3 pl-10 pr-4 rounded-xl text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>
        {isLoading && (
          <p className="mt-2 text-xs text-slate-400">Loading live parking availability…</p>
        )}
        {error && !isLoading && (
          <p className="mt-2 text-xs text-amber-500">{error}</p>
        )}
        {!isLoading && !error && spots.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">No parking spots found nearby.</p>
        )}

        {/* Near Me Button */}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const userLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  setUserLocation(userLoc);
                  setShowNearbyOnly(true);
                  setSelectedFilter('ALL'); // Reset other filters
                },
                (error) => {
                  console.error(error);
                  alert('Unable to get your location. Please enable location services.');
                }
              );
            } else {
              alert('Geolocation is not supported by your browser.');
            }
          }}
          className={`w-full mt-2 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${showNearbyOnly
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          <Navigation size={18} className={showNearbyOnly ? 'text-white' : 'text-blue-600'} />
          {showNearbyOnly ? 'Showing Nearby Spots' : 'Find Near Me'}
        </button>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'ALL', label: 'All', icon: null },
            { id: 'EV', label: 'EV Charger', icon: Battery },
            { id: 'DIS', label: 'Accessible', icon: Accessibility },
            { id: 'FREE', label: 'Free', icon: null }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFilter(f.id as any);
                if (f.id === 'ALL') setShowNearbyOnly(false);
              }}
              className={`flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedFilter === f.id && !showNearbyOnly
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
                }`}
            >
              {f.icon && <f.icon size={14} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-10">
        <ParklyMap
          spots={filteredSpots}
          selectedSpotId={selectedSpotId}
          onSelect={handleSpotSelect}
          userLocation={userLocation}
        />
      </div>

      {/* Bottom Sheet for Selected Spot */}
      {selectedSpot && (
        <div className="absolute bottom-16 left-0 right-0 p-4 bg-white rounded-t-3xl shadow-2xl z-40 transform transition-transform duration-300 ease-out border-t border-slate-100">
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

          <button
            onClick={() => setSelectedSpotId(null)}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 z-50"
          >
            <X size={20} />
          </button>

          {/* Spot Image Preview */}
          <div className="h-48 w-full mb-4 rounded-xl overflow-hidden bg-slate-900 relative">
            <img
              src={selectedSpot.imageUrl || `https://picsum.photos/seed/${selectedSpot.id}/800/400`}
              alt={selectedSpot.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{selectedSpot.name}</h3>
              <p className="text-slate-500 text-sm">{selectedSpot.distance} mi • {selectedSpot.address}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">${selectedSpot.pricePerHour}<span className="text-sm text-slate-400 font-normal">/hr</span></p>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className={`flex - 1 p - 2 rounded - lg text - center ${selectedSpot.availableSpots > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} `}>
              <span className="block text-lg font-bold">{selectedSpot.availableSpots}</span>
              <span className="text-xs uppercase font-bold opacity-80">Open Spots</span>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-blue-50 text-blue-700 text-center">
              <span className="block text-lg font-bold">{selectedSpot.type}</span>
              <span className="text-xs uppercase font-bold opacity-80">Type</span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/details/${selectedSpot.id}`)}
            className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
};