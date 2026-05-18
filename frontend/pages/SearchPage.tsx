import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Battery, Accessibility, Clock } from 'lucide-react';
import { SimulatedMap } from '../components/SimulatedMap';
import { MOCK_PARKING_SPOTS } from '../services/mockData';
import { ParkingSpot } from '../types';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'EV' | 'DIS' | 'FREE'>('ALL');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const filteredSpots = useMemo(() => {
    return MOCK_PARKING_SPOTS.filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            spot.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (selectedFilter === 'EV') matchesFilter = spot.features.includes('EV Charging');
      if (selectedFilter === 'DIS') matchesFilter = spot.features.includes('Disabled');
      if (selectedFilter === 'FREE') matchesFilter = spot.pricePerHour === 0;

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, selectedFilter]);

  const handleSpotSelect = (id: string) => {
    setSelectedSpotId(id);
  };

  const selectedSpot = MOCK_PARKING_SPOTS.find(s => s.id === selectedSpotId);

  return (
    <div className="h-full flex flex-col relative bg-slate-100">
      {/* Search Header */}
      <div className="px-4 pt-4 pb-2 bg-white shadow-sm z-30">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 py-3 pl-10 pr-4 rounded-xl text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
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
                onClick={() => setSelectedFilter(f.id as any)}
                className={`flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedFilter === f.id 
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
      <div className="flex-1 relative z-10" onClick={() => setSelectedSpotId(null)}>
        <SimulatedMap spots={filteredSpots} selectedId={selectedSpotId} onSelect={handleSpotSelect} />
      </div>

      {/* Bottom Sheet for Selected Spot */}
      {selectedSpot && (
        <div className="absolute bottom-16 left-0 right-0 p-4 bg-white rounded-t-3xl shadow-2xl z-40 transform transition-transform duration-300 ease-out border-t border-slate-100">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
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
                 <div className={`flex-1 p-2 rounded-lg text-center ${selectedSpot.availableSpots > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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