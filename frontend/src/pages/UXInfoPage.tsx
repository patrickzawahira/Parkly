import React from 'react';
import { PERSONAS } from '../services/mockData';
import { User, Map, CreditCard, Flag } from 'lucide-react';

export const UXInfoPage: React.FC = () => {
  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-20 p-4">
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-900">UX Design Process</h1>
         <p className="text-slate-500 mt-2">ITEC 460 Final Project Deliverables</p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="text-blue-600" /> User Personas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
            {PERSONAS.map((p, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={p.image} alt={p.name} className="w-16 h-16 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-lg">{p.name}</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{p.role}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Goals</p>
                            <ul className="list-disc pl-4 text-sm text-slate-700">
                                {p.goals.map((g, idx) => <li key={idx}>{g}</li>)}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Pain Points</p>
                            <ul className="list-disc pl-4 text-sm text-red-600">
                                {p.painPoints.map((pp, idx) => <li key={idx}>{pp}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Map className="text-blue-600" /> Journey Map
        </h2>
        <div className="relative border-l-4 border-blue-200 ml-3 space-y-8">
            <div className="ml-6 relative">
                <div className="absolute -left-[38px] bg-blue-600 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
                <h3 className="font-bold text-lg">1. Discovery</h3>
                <p className="text-slate-600 text-sm mt-1">User opens app while approaching destination. Uses voice search via Gemini to "Find cheap parking".</p>
            </div>
            <div className="ml-6 relative">
                <div className="absolute -left-[38px] bg-blue-600 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
                <h3 className="font-bold text-lg">2. Selection</h3>
                <p className="text-slate-600 text-sm mt-1">Filters map for "Available" spots. Taps a pin to see price ($5/hr). Decides to reserve.</p>
            </div>
             <div className="ml-6 relative">
                <div className="absolute -left-[38px] bg-blue-600 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
                <h3 className="font-bold text-lg">3. Action</h3>
                <p className="text-slate-600 text-sm mt-1">Swipes slider to reserve spot. Receives immediate visual feedback (Green confirmation).</p>
            </div>
             <div className="ml-6 relative">
                <div className="absolute -left-[38px] bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
                <h3 className="font-bold text-lg">4. Navigation</h3>
                <p className="text-slate-600 text-sm mt-1">App transitions to high-contrast Navigation Mode with large text for driving safety.</p>
            </div>
        </div>
      </section>
    </div>
  );
};