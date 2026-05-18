import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, XCircle, Volume2 } from 'lucide-react';
import { MOCK_PARKING_SPOTS } from '../services/mockData';

export const NavigationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const spot = MOCK_PARKING_SPOTS.find(s => s.id === id);
  
  // Navigation Simulation State
  const [distance, setDistance] = useState(spot?.distance || 2.0);
  const [instruction, setInstruction] = useState("Head North on Main St");
  const [eta, setEta] = useState(10); // minutes

  useEffect(() => {
    // Simulate driving
    const interval = setInterval(() => {
        setDistance(prev => {
            const newDist = Math.max(0, prev - 0.05);
            if (newDist < 0.1) {
                setInstruction("You have arrived at your destination");
            } else if (newDist < 0.5) {
                setInstruction(`Turn right into ${spot?.name}`);
            } else if (newDist < 1.0) {
                setInstruction("Continue straight for 0.5 miles");
            }
            return newDist;
        });
        setEta(prev => Math.max(0, Math.ceil(prev - 0.2)));
    }, 2000);

    return () => clearInterval(interval);
  }, [spot]);

  if (!spot) return <div>Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
        {/* Nav Header */}
        <div className="p-4 flex items-center justify-between bg-slate-800 shadow-md">
            <button onClick={() => navigate('/')} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
                <XCircle size={28} className="text-red-400" />
            </button>
            <div className="text-center">
                 <h2 className="font-bold text-lg">{spot.name}</h2>
                 <p className="text-slate-400 text-sm">{spot.address}</p>
            </div>
             <button className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
                <Volume2 size={28} className="text-blue-400" />
            </button>
        </div>

        {/* Main Instruction */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
             <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(37,99,235,0.5)]">
                 <Navigation size={64} className="text-white fill-current transform rotate-45" />
             </div>
             <div>
                <h1 className="text-4xl font-black mb-2 leading-tight">{instruction}</h1>
                <p className="text-slate-400 text-xl">Then arrive at destination</p>
             </div>
        </div>

        {/* Bottom Metrics */}
        <div className="bg-slate-800 p-6 rounded-t-3xl grid grid-cols-3 gap-4 border-t border-slate-700">
            <div className="text-center">
                <p className="text-slate-400 text-sm font-bold uppercase">Time</p>
                <p className="text-3xl font-black text-green-400">{eta} <span className="text-sm font-normal text-slate-400">min</span></p>
            </div>
            <div className="text-center border-l border-slate-600">
                <p className="text-slate-400 text-sm font-bold uppercase">Distance</p>
                <p className="text-3xl font-black text-white">{distance.toFixed(1)} <span className="text-sm font-normal text-slate-400">mi</span></p>
            </div>
            <div className="text-center border-l border-slate-600">
                <p className="text-slate-400 text-sm font-bold uppercase">Price</p>
                <p className="text-3xl font-black text-white">${spot.pricePerHour}</p>
            </div>
        </div>
    </div>
  );
};