import { v4 as uuid } from 'uuid';
import { ParkingReceipt, ParkingSpot, ParkingReceiptStatus } from '../types';

const STORAGE_KEY = 'parkly_parking_receipts';

const isBrowser = typeof window !== 'undefined';

const loadReceipts = (): ParkingReceipt[] => {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistReceipts = (receipts: ParkingReceipt[]) => {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
};

const markExpired = (receipts: ParkingReceipt[]) => {
  const now = Date.now();
  let hasChanges = false;
  const updated = receipts.map((receipt) => {
    if (receipt.status === 'active' && new Date(receipt.endTime).getTime() < now) {
      hasChanges = true;
      return { ...receipt, status: 'expired' as ParkingReceiptStatus };
    }
    return receipt;
  });
  if (hasChanges) {
    persistReceipts(updated);
  }
  return updated;
};

export const reservationStore = {
  startSession(spot: ParkingSpot, durationMinutes: number, totalPaid?: number): ParkingReceipt {
    const receipts = markExpired(loadReceipts());
    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const resolvedTotal =
      typeof totalPaid === 'number' ? totalPaid : (spot.pricePerHour * durationMinutes) / 60;

    const receipt: ParkingReceipt = {
      id: uuid(),
      spotId: spot.id,
      spotName: spot.name,
      address: spot.address,
      pricePerHour: spot.pricePerHour,
      durationMinutes,
      totalPaid: Number(resolvedTotal.toFixed(2)),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'active',
    };

    receipts.unshift(receipt);
    persistReceipts(receipts);
    return receipt;
  },

  completeSession(id: string, nextStatus: ParkingReceiptStatus = 'completed') {
    const receipts = loadReceipts();
    const updated = receipts.map((receipt) =>
      receipt.id === id ? { ...receipt, status: nextStatus } : receipt
    );
    persistReceipts(updated);
  },

  getActive(): ParkingReceipt | null {
    const receipts = markExpired(loadReceipts());
    return receipts.find((receipt) => receipt.status === 'active') || null;
  },

  getHistory(): ParkingReceipt[] {
    return markExpired(loadReceipts());
  },

  clearAll() {
    if (!isBrowser) return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

