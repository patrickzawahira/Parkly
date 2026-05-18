import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, History, Timer, FileText, Plus, XCircle, Navigation } from 'lucide-react';
import { ParkingReceipt } from '../types';
import { ParklyLogo } from '../components/ParklyLogo';
import { reservations } from '../services/api';

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!mins) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs}h ${mins}m`;
};

const timeRemainingLabel = (receipt: ParkingReceipt) => {
  const remaining = new Date(receipt.endTime).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  const minutes = Math.ceil(remaining / 60000);
  return `${minutes} min left`;
};

export const ParkedPage: React.FC = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ParkingReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await reservations.list();
      const mapped: ParkingReceipt[] = data.map((r: any) => {
        const spot = r.spotId || {};
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
        const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

        let status = r.status || 'active';
        if (status === 'active' && end.getTime() < Date.now()) {
          status = 'expired';
        }

        return {
          id: r._id,
          spotId: spot._id || r.spotId,
          spotName: spot.name || 'Parking Spot',
          address: spot.address || '',
          pricePerHour:
            r.totalPrice && minutes
              ? Number(((r.totalPrice * 60) / minutes).toFixed(2))
              : spot.pricePerHour || 0,
          durationMinutes: minutes,
          totalPaid: r.totalPrice || 0,
          startTime: r.startTime,
          endTime: r.endTime,
          status,
        };
      });
      setReceipts(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeReceipt = useMemo(
    () => receipts.find((receipt) => receipt.status === 'active') || null,
    [receipts]
  );

  const pendingReceipt = useMemo(
    () => receipts.find((receipt) => receipt.status === 'pending' || receipt.status === 'en_route') || null,
    [receipts]
  );

  const history = useMemo(
    () => receipts.filter((receipt) => receipt.id !== activeReceipt?.id && receipt.id !== pendingReceipt?.id),
    [receipts, activeReceipt, pendingReceipt]
  );

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-24">
      <div className="bg-white p-6 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <ParklyLogo size={44} textClassName="text-slate-900" subtitle="Parking receipts" />
          <div className="text-right text-xs text-slate-400 uppercase tracking-[0.3em]">
            Parked
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {isLoading && (
          <p className="text-xs text-slate-400 px-1">Syncing with server…</p>
        )}
        {error && (
          <p className="text-xs text-red-500 px-1">{error}</p>
        )}

        {activeReceipt && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase font-semibold">Active Parking</p>
                <h2 className="text-xl font-bold text-slate-900">{activeReceipt.spotName}</h2>
                <p className="text-sm text-slate-500">{activeReceipt.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase">Ends</p>
                <p className="text-base font-semibold text-slate-900">
                  {new Date(activeReceipt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase">Time left</p>
                <p className="text-base font-semibold text-blue-600">{timeRemainingLabel(activeReceipt)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase">Paid</p>
                <p className="text-base font-semibold text-slate-900">${activeReceipt.totalPaid.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Overstaying past {new Date(activeReceipt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} will incur standard overtime rates.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  const baseMinutes = activeReceipt.durationMinutes;
                  await reservations.update(activeReceipt.id, {
                    action: 'extend',
                    durationMinutes: baseMinutes + 15,
                  });
                  refresh();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold py-2 rounded-xl"
              >
                <Plus size={14} />
                +15 min
              </button>
              <button
                onClick={async () => {
                  await reservations.update(activeReceipt.id, { action: 'cancel' });
                  refresh();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold py-2 rounded-xl"
              >
                <XCircle size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Pending Reservation */}
        {pendingReceipt && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Timer />
              </div>
              <div>
                <p className={`text-sm uppercase font-semibold ${pendingReceipt.status === 'en_route' ? 'text-blue-600' : 'text-amber-600'}`}>
                  {pendingReceipt.status === 'en_route' ? 'Navigating to Spot' : 'Pending Reservation'}
                </p>
                <h2 className="text-xl font-bold text-slate-900">{pendingReceipt.spotName}</h2>
                <p className="text-sm text-slate-500">{pendingReceipt.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase">Expires</p>
                <p className="text-base font-semibold text-slate-900">
                  {new Date(pendingReceipt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase">Time left</p>
                <p className="text-base font-semibold text-amber-600">{timeRemainingLabel(pendingReceipt)}</p>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              Navigate to the spot and complete payment within {timeRemainingLabel(pendingReceipt)} to confirm your reservation.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  await reservations.update(pendingReceipt.id, { status: 'en_route' });
                  navigate(`/navigate/${pendingReceipt.spotId}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold py-3 rounded-xl"
              >
                <Navigation size={16} />
                Navigate to Spot
              </button>
              <button
                onClick={async () => {
                  await reservations.delete(pendingReceipt.id);
                  refresh();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold py-3 rounded-xl"
              >
                <XCircle size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {!activeReceipt && !pendingReceipt && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500">
            <Timer className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="font-semibold">No active parking</p>
            <p className="text-sm text-slate-400">Reserve a spot to see it tracked here.</p>
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100">
            <History size={18} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Parking history
            </h3>
          </div>

          {history.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">No receipts yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((receipt) => (
                <div key={receipt.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{receipt.spotName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(receipt.startTime).toLocaleDateString()} • {formatDuration(receipt.durationMinutes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${receipt.totalPaid.toFixed(2)}</p>
                    <p
                      className={`text-xs font-semibold ${receipt.status === 'expired'
                        ? 'text-red-500'
                        : receipt.status === 'completed'
                          ? 'text-emerald-500'
                          : 'text-slate-500'
                        }`}
                    >
                      {receipt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

