import React, { useState, useEffect } from 'react';
import { User, Shield, Eye, Smartphone, LogOut, Volume2, Type, CreditCard, Car, ChevronRight, X, Save, Plus, Trash2 } from 'lucide-react';
import { user as userApi } from '../services/api';
import { voiceService } from '../services/voiceService';
import { ParklyLogo } from '../components/ParklyLogo';

interface UserData {
  name: string;
  email: string;
  licensePlate?: string;
  personalInfo?: {
    phone?: string;
    address?: string;
  };
  paymentMethods?: Array<{
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
  }>;
  preferences?: {
    accessibility?: {
      highContrast?: boolean;
      largeText?: boolean;
      voiceGuidance?: boolean;
    };
    app?: {
      notifications?: boolean;
      darkMode?: 'light' | 'dark' | 'system';
    };
  };
}

interface SettingsPageProps {
  user: UserData;
  onLogout: () => void;
  onUserUpdate: (updatedUser: UserData) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout, onUserUpdate }) => {
  const [highContrast, setHighContrast] = useState(user.preferences?.accessibility?.highContrast || false);
  const [largeText, setLargeText] = useState(user.preferences?.accessibility?.largeText || false);
  const [voiceGuidance, setVoiceGuidance] = useState(user.preferences?.accessibility?.voiceGuidance || false);
  const [notifications, setNotifications] = useState(user.preferences?.app?.notifications !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Scroll container ref
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Modal states
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    phone: user.personalInfo?.phone || '',
    address: user.personalInfo?.address || ''
  });
  const [licensePlate, setLicensePlate] = useState(user.licensePlate || '');
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
  }>>(user.paymentMethods || []);

  // New Card Form State
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  // Load user preferences from backend when component mounts
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const userData = await userApi.getProfile();
        if (userData.preferences?.accessibility) {
          setHighContrast(userData.preferences.accessibility.highContrast || false);
          setLargeText(userData.preferences.accessibility.largeText || false);
          setVoiceGuidance(userData.preferences.accessibility.voiceGuidance || false);
        }
        if (userData.preferences?.app) {
          setNotifications(userData.preferences.app.notifications !== false);
        }
        if (userData.personalInfo) {
          setPersonalInfo({
            phone: userData.personalInfo.phone || '',
            address: userData.personalInfo.address || ''
          });
        }
        setLicensePlate(userData.licensePlate || '');
        setPaymentMethods(Array.isArray(userData.paymentMethods) ? userData.paymentMethods : []);
        onUserUpdate(userData);
      } catch (err) {
        console.error('Failed to load user preferences:', err);
        setError('Failed to load settings. Please try again.');
      }
    };

    loadUserPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply accessibility settings to the app
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }

    // Enable/disable voice guidance
    voiceService.setEnabled(voiceGuidance);
  }, [highContrast, largeText, voiceGuidance]);

  const updatePreference = async (updates: any) => {
    setIsSaving(true);
    setError('');

    try {
      const updatedUser = await userApi.updateProfile(updates);

      // Update state with server response
      if (updatedUser.preferences?.accessibility) {
        setHighContrast(updatedUser.preferences.accessibility.highContrast || false);
        setLargeText(updatedUser.preferences.accessibility.largeText || false);
        setVoiceGuidance(updatedUser.preferences.accessibility.voiceGuidance || false);
      }
      if (updatedUser.preferences?.app && updatedUser.preferences.app.notifications !== undefined) {
        setNotifications(updatedUser.preferences.app.notifications !== false);
      }
      if (updatedUser.personalInfo) {
        setPersonalInfo({
          phone: updatedUser.personalInfo.phone || '',
          address: updatedUser.personalInfo.address || ''
        });
      }
      setLicensePlate(updatedUser.licensePlate || '');
      setPaymentMethods(updatedUser.paymentMethods || []);

      onUserUpdate(updatedUser);
      return true;
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      setError(err.message || 'Failed to save settings. Please ensure the backend is running.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    updatePreference({
      preferences: {
        accessibility: {
          highContrast: newValue,
          largeText,
          voiceGuidance,
        }
      }
    });
  };

  const handleLargeTextToggle = () => {
    const newValue = !largeText;
    setLargeText(newValue);
    updatePreference({
      preferences: {
        accessibility: {
          highContrast,
          largeText: newValue,
          voiceGuidance,
        }
      }
    });
  };

  const handleVoiceGuidanceToggle = () => {
    const newValue = !voiceGuidance;
    setVoiceGuidance(newValue);
    updatePreference({
      preferences: {
        accessibility: {
          highContrast,
          largeText,
          voiceGuidance: newValue,
        }
      }
    });
  };

  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    updatePreference({
      preferences: {
        app: {
          notifications: newValue
        }
      }
    });
  };

  const saveScrollPosition = () => {
    return scrollContainerRef.current?.scrollTop || 0;
  };

  const restoreScrollPosition = (position: number) => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = position;
      }
    }, 100);
  };

  const handleSavePersonalInfo = async () => {
    const scrollPos = saveScrollPosition();
    const success = await updatePreference({ personalInfo });
    if (success) {
      setShowPersonalInfoModal(false);
      restoreScrollPosition(scrollPos);
    }
  };

  const handleSaveVehicle = async () => {
    const scrollPos = saveScrollPosition();
    const success = await updatePreference({ licensePlate });
    if (success) {
      setShowVehicleModal(false);
      restoreScrollPosition(scrollPos);
    }
  };

  const handleAddPaymentMethod = async () => {
    const scrollPos = saveScrollPosition();

    // Basic validation
    if (!newCard.number || !newCard.expiry || !newCard.cvc || !newCard.name) {
      alert('Please fill in all card details');
      return;
    }

    // Parse expiry
    const [expMonth, expYear] = newCard.expiry.split('/').map(s => parseInt(s.trim()));

    // In a real app, this would integrate with a payment processor (Stripe, etc.)
    // We simulate adding the card securely
    const newPayment = {
      type: 'card',
      last4: newCard.number.slice(-4),
      brand: 'Visa', // Simplified detection
      expiryMonth: expMonth || 12,
      expiryYear: expYear ? 2000 + expYear : 2025,
      isDefault: paymentMethods.length === 0
    };

    const updated = [...paymentMethods, newPayment];
    setPaymentMethods(updated);
    const success = await updatePreference({ paymentMethods: updated });
    if (success) {
      setShowPaymentModal(false);
      setNewCard({ number: '', expiry: '', cvc: '', name: '' }); // Reset form
      restoreScrollPosition(scrollPos);
    }
  };

  const handleRemovePaymentMethod = async (index: number) => {
    const scrollPos = saveScrollPosition();

    const updated = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(updated);
    await updatePreference({ paymentMethods: updated });

    restoreScrollPosition(scrollPos);
  };

  const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-white border-y border-slate-200 sm:border sm:rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );

  const SettingItem = ({ icon: Icon, label, value, type = 'arrow', onClick, children }: any) => (
    <div
      onClick={type === 'arrow' ? onClick : undefined}
      className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
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
          {children || <ChevronRight size={18} />}
        </div>
      )}

      {type === 'select' && children}
    </div>
  );



  return (
    <div ref={scrollContainerRef} className="h-full bg-slate-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <ParklyLogo
            size={48}
            textClassName="text-slate-900"
            subtitle="Control center"
          />
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Signed in as</p>
            <p>{user.email}</p>
            {isSaving && <p className="text-blue-600 mt-1">Syncing preferences…</p>}
            {error && <p className="text-red-600 mt-1">{error}</p>}
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user.name}</h2>
            <p className="text-blue-100 text-sm">{user.email}</p>
            {licensePlate && (
              <div className="mt-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs">
                <Car size={12} />
                {licensePlate}
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingSection title="Accessibility">
        <SettingItem
          icon={Eye}
          label="High Contrast"
          type="toggle"
          value={highContrast}
          onClick={handleHighContrastToggle}
        />
        <SettingItem
          icon={Type}
          label="Large Text"
          type="toggle"
          value={largeText}
          onClick={handleLargeTextToggle}
        />
        <SettingItem
          icon={Volume2}
          label="Voice Guidance"
          type="toggle"
          value={voiceGuidance}
          onClick={handleVoiceGuidanceToggle}
        />
      </SettingSection>

      <SettingSection title="Account & Payment">
        <SettingItem
          icon={User}
          label="Personal Information"
          onClick={() => setShowPersonalInfoModal(true)}
        />
        <SettingItem
          icon={Car}
          label="Vehicle Management"
          value={licensePlate ? `1 Car (${licensePlate})` : "Add Vehicle"}
          onClick={() => setShowVehicleModal(true)}
        />
        <SettingItem
          icon={CreditCard}
          label="Payment Methods"
          value={paymentMethods.length > 0 ? `${paymentMethods.length} Card${paymentMethods.length > 1 ? 's' : ''}` : "Add Card"}
          onClick={() => setShowPaymentModal(true)}
        />
        <SettingItem icon={Shield} label="Privacy & Security" />
      </SettingSection>

      <SettingSection title="App">
        <SettingItem
          icon={Smartphone}
          label="Notifications"
          type="toggle"
          value={notifications}
          onClick={handleNotificationsToggle}
        />
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

      {/* Personal Information Modal */}
      <Modal isOpen={showPersonalInfoModal} onClose={() => setShowPersonalInfoModal(false)} title="Personal Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, City, State 12345"
              rows={3}
            />
          </div>
          <button
            onClick={handleSavePersonalInfo}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Vehicle Management Modal */}
      <Modal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="Vehicle Management">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC-1234"
              maxLength={10}
            />
          </div>
          <button
            onClick={handleSaveVehicle}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Payment Methods">
        <div className="space-y-4">
          {Array.isArray(paymentMethods) && paymentMethods.length > 0 ? (
            <div className="space-y-2">
              {paymentMethods.map((method, index) => {
                if (!method || typeof method !== 'object') return null;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {method.brand || 'Card'} •••• {method.last4 || '****'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {method.expiryMonth && method.expiryYear
                            ? `Expires ${method.expiryMonth}/${method.expiryYear}`
                            : 'No expiry date'}
                          {method.isDefault && ' • Default'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePaymentMethod(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Card</h3>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Card Number"
                  value={newCard.number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setNewCard({ ...newCard, number: val });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={5}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  value={newCard.cvc}
                  onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className="w-24 px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleAddPaymentMethod}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Payment Method
          </button>
        </div>
      </Modal>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
