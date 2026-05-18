import React, { useState } from 'react';
import { User, Shield, Eye, Smartphone, LogOut, Moon, Volume2, Type, CreditCard, Car, ChevronRight } from 'lucide-react';
import { MOCK_USER } from '../services/mockData';

interface SettingsPageProps {
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(true);

  const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-white border-y border-slate-200 sm:border sm:rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );

  const SettingItem = ({ icon: Icon, label, value, type = 'arrow', onClick }: any) => (
    <div 
        onClick={type === 'arrow' ? onClick : undefined}
        className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
             <Icon size={18} />
        </div>
        <span className="font-medium text-slate-800">{label}</span>
      </div>
      
      {type === 'toggle' && (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'left-6' : 'left-1'}`} />
        </div>
      )}
      
      {type === 'arrow' && (
        <div className="flex items-center gap-2 text-slate-400">
            {value && <span className="text-sm text-slate-500">{value}</span>}
            <ChevronRight size={18} />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {/* User Card */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {MOCK_USER.name.charAt(0)}
            </div>
            <div>
                <h2 className="text-lg font-bold">{MOCK_USER.name}</h2>
                <p className="text-blue-100 text-sm">{MOCK_USER.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs">
                    <Car size={12} />
                    {MOCK_USER.licensePlate}
                </div>
            </div>
        </div>
      </div>

      <SettingSection title="Accessibility">
        <SettingItem 
            icon={Eye} 
            label="High Contrast" 
            type="toggle" 
            value={highContrast} 
            onClick={() => setHighContrast(!highContrast)} 
        />
        <SettingItem 
            icon={Type} 
            label="Large Text" 
            type="toggle" 
            value={largeText} 
            onClick={() => setLargeText(!largeText)} 
        />
        <SettingItem 
            icon={Volume2} 
            label="Voice Guidance" 
            type="toggle" 
            value={voiceGuidance} 
            onClick={() => setVoiceGuidance(!voiceGuidance)} 
        />
      </SettingSection>

      <SettingSection title="Account & Payment">
        <SettingItem icon={User} label="Personal Information" />
        <SettingItem icon={Car} label="Vehicle Management" value="1 Car" />
        <SettingItem icon={CreditCard} label="Payment Methods" value="Visa ••42" />
        <SettingItem icon={Shield} label="Privacy & Security" />
      </SettingSection>

      <SettingSection title="App">
        <SettingItem icon={Smartphone} label="Notifications" value="On" />
        <SettingItem icon={Moon} label="Dark Mode" value="System" />
      </SettingSection>

      <div className="px-4">
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl transition-colors"
        >
            <LogOut size={20} />
            Log Out
        </button>
        <p className="text-center text-slate-400 text-xs mt-4">Version 2.0.1 • Build 4892</p>
      </div>
    </div>
  );
};