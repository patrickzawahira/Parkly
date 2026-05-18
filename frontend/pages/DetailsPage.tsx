import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Clock, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { MOCK_PARKING_SPOTS } from '../services/mockData';

export const DetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const spot = MOCK_PARKING_SPOTS.find(s => s.id === id);
  const [sliderValue, setSliderValue] = useState(0);
  const [isReserved, setIsReserved] = useState(false);

  if (!spot) return <div>Spot not found</div>;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
    if (Number(e.target.value) > 90) {
        setIsReserved(true);
    }
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 flex items-center shadow-sm z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
        </button>
        <h1 className="ml-2 text-xl font-bold">Details</h1>
      </div>

      {/* Hero Image / Map Placeholder */}
      <div className="h-48 bg-slate-300 w-full relative">
        <img src={`https://picsum.photos/seed/${spot.id}/800/400`} alt="Parking location" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
             <h2 className="text-white text-3xl font-bold">{spot.name}</h2>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-400 text-sm font-medium uppercase">Price</p>
                <p className="text-2xl font-bold text-slate-900">${spot.pricePerHour}/h</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-400 text-sm font-medium uppercase">Distance</p>
                <p className="text-2xl font-bold text-slate-900">{spot.distance} mi</p>
            </div>
        </div>

        {/* Features & Restrictions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Features & Rules</h3>
            <ul className="space-y-3">
                {spot.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-700">
                        {feature.includes('EV') ? <Zap className="text-yellow-500" /> : 
                         feature.includes('Disabled') ? <ShieldCheck className="text-blue-500" /> :
                         <Clock className="text-slate-400" />}
                        <span className="font-medium">{feature}</span>
                    </li>
                ))}
                <li className="flex items-center gap-3 text-slate-700">
                     <CreditCard className="text-slate-400" />
                     <span className="font-medium">Accepts Card & App Payment</span>
                </li>
            </ul>
        </div>

        {/* Action Area */}
        {isReserved ? (
            <div className="bg-green-100 border border-green-200 p-6 rounded-2xl text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
                    <ShieldCheck className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-green-800">Spot Reserved!</h3>
                <p className="text-green-700 mb-4">Spot #B42 is held for 15 mins.</p>
                <button 
                    onClick={() => navigate(`/navigate/${spot.id}`)}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200"
                >
                    Start Navigation
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                 <button 
                    onClick={() => navigate(`/navigate/${spot.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                    <Navigation size={20} />
                    Navigate Now
                </button>

                {/* Gesture Reserve */}
                <div className="relative h-16 bg-slate-200 rounded-full overflow-hidden mt-6 shadow-inner select-none">
                    <div 
                        className="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-75 ease-linear flex items-center justify-end px-4"
                        style={{ width: `${Math.max(15, sliderValue)}%` }}
                    >
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-sm mix-blend-multiply">
                            Slide to Reserve
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sliderValue}
                        onChange={handleSliderChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                </div>
                <p className="text-center text-xs text-slate-400">Swipe right fully to confirm reservation</p>
            </div>
        )}
      </div>
    </div>
  );
};