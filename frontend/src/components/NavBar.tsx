import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, BarChart2, Settings, ParkingCircle } from 'lucide-react';
import { ParklyLogo } from './ParklyLogo';

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 h-20 flex justify-around items-center pb-safe relative">

      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <MapPin size={24} />
        <span className="text-xs mt-1 font-medium">Find</span>
      </button>

      <button
        onClick={() => navigate('/parked')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/parked') ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <ParkingCircle size={24} />
        <span className="text-xs mt-1 font-medium">Parked</span>
      </button>

      <button
        onClick={() => navigate('/analytics')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/analytics') ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <BarChart2 size={24} />
        <span className="text-xs mt-1 font-medium">Trends</span>
      </button>

      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/settings') ? 'text-blue-600' : 'text-slate-400'}`}
      >
        <Settings size={24} />
        <span className="text-xs mt-1 font-medium">Settings</span>
      </button>
    </div>
  );
};