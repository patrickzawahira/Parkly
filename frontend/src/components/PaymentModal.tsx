import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { ParkingSpot, ParkingReceipt } from '../types';
import { parking, reservations } from '../services/api';

interface PaymentModalProps {
  open: boolean;
  spot: ParkingSpot;
  durationMinutes?: number;
  reservationId?: string; // If provided, update existing reservation instead of creating new
  onClose: () => void;
  onSuccess: (receipt: ParkingReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  spot,
  durationMinutes = 60,
  reservationId,
  onClose,
  onSuccess,
}) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [selectedHours, setSelectedHours] = useState(1);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1); // -1 means use new card
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Load saved cards when modal opens
  React.useEffect(() => {
    if (open) {
      const loadCards = async () => {
        setIsLoadingCards(true);
        try {
          const { user } = await import('../services/api');
          const profile = await user.getProfile();
          if (profile.paymentMethods && profile.paymentMethods.length > 0) {
            setSavedCards(profile.paymentMethods);
            // Default to the first card (or default one if marked)
            const defaultIndex = profile.paymentMethods.findIndex((m: any) => m.isDefault);
            setSelectedCardIndex(defaultIndex >= 0 ? defaultIndex : 0);
          }
        } catch (e) {
          console.error('Failed to load saved cards', e);
        } finally {
          setIsLoadingCards(false);
        }
      };
      loadCards();
    }
  }, [open]);

  if (!open) return null;

  // Always use selectedHours for calculation if user can choose, otherwise fallback
  const finalDuration = selectedHours * 60;
  const amount = Number(((spot.pricePerHour * finalDuration) / 60).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If using new card, validate fields
    if (selectedCardIndex === -1) {
      if (!cardName || cardNumber.replace(/\s/g, '').length < 12 || !expiry || cvv.length < 3) {
        setError('Please fill out all card details.');
        return;
      }
    }

    setIsPaying(true);
    try {
      let updated;

      if (reservationId) {
        // Update existing pending reservation to active
        updated = await reservations.update(reservationId, {
          status: 'active',
          durationMinutes: finalDuration,
          paymentStatus: 'paid',
        });
      } else {
        // Create new reservation
        const reservation = await parking.reserve(spot.id, finalDuration);
        // Mark as paid
        updated = await reservations.update(reservation._id, {
          paymentStatus: 'paid',
        });
      }

      const durationMs =
        new Date(updated.endTime).getTime() - new Date(updated.startTime).getTime();
      const minutes = Math.max(1, Math.round(durationMs / 60000));

      const receipt: ParkingReceipt = {
        id: updated._id,
        spotId: updated.spotId._id || updated.spotId,
        spotName: updated.spotId.name || spot.name,
        address: updated.spotId.address || spot.address,
        pricePerHour: updated.totalPrice && minutes
          ? Number(((updated.totalPrice * 60) / minutes).toFixed(2))
          : spot.pricePerHour,
        durationMinutes: minutes,
        totalPaid: updated.totalPrice || amount,
        startTime: updated.startTime,
        endTime: updated.endTime,
        status: updated.status === 'active' ? 'active' : updated.status,
      };

      onSuccess(receipt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CreditCard />
          </div>
          <div>
            <p className="text-sm text-slate-500 uppercase font-semibold tracking-wider">Payment</p>
            <h2 className="text-xl font-bold text-slate-900">Reserve {spot.name}</h2>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">Total due</p>
            <p className="text-3xl font-black text-slate-900">${amount.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedHours} hour{selectedHours > 1 ? 's' : ''} • ${spot.pricePerHour}/hr
            </p>
          </div>

          {/* Duration Selector - Always Visible */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Parking Duration</label>
            <select
              value={selectedHours}
              onChange={(e) => setSelectedHours(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                <option key={hours} value={hours}>
                  {hours} hour{hours > 1 ? 's' : ''} - ${((spot.pricePerHour * hours).toFixed(2))}
                </option>
              ))}
            </select>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>

            {/* Saved Cards Selection */}
            {savedCards.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Payment Method</label>
                <div className="space-y-2">
                  {savedCards.map((card, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCardIndex(index)}
                      className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedCardIndex === index
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCardIndex === index ? 'border-blue-600' : 'border-slate-400'
                        }`}>
                        {selectedCardIndex === index && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <CreditCard size={20} className="text-slate-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {card.brand || 'Card'} •••• {card.last4}
                        </p>
                        <p className="text-xs text-slate-500">
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => setSelectedCardIndex(-1)}
                    className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedCardIndex === -1
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCardIndex === -1 ? 'border-blue-600' : 'border-slate-400'
                      }`}>
                      {selectedCardIndex === -1 && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <p className="text-sm font-medium text-slate-900">Use a new card</p>
                  </div>
                </div>
              </div>
            )}

            {/* New Card Form - Only show if "Use new card" is selected */}
            {selectedCardIndex === -1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Alex Driver"
                    required={selectedCardIndex === -1}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    required={selectedCardIndex === -1}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Expiry</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                      required={selectedCardIndex === -1}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">CVV</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      required={selectedCardIndex === -1}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isPaying}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPaying ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

