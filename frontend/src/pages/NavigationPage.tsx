import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation as NavIcon, Volume2, Flag, CheckCircle2, Clock } from 'lucide-react';
import L from 'leaflet';
import { parking, reservations } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import { ParkingReceipt, ParkingSpot } from '../types';
import { MOCK_PARKING_SPOTS } from '../services/mockData';
import 'leaflet/dist/leaflet.css';

const DoubleTapListener: React.FC<{ onArrive: () => void }> = ({ onArrive }) => {
  useMapEvents({
    dblclick: () => onArrive(),
  });
  return null;
};

const MapUpdater: React.FC<{ start: { lat: number; lng: number }; end: { lat: number; lng: number } }> = ({ start, end }) => {
  const map = useMap();
  useEffect(() => {
    if (start.lat === 0 && start.lng === 0) return;
    const bounds = L.latLngBounds([start, end]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    map.invalidateSize();
  }, [start, end, map]);
  return null;
};

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const interpolatePosition = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  progress: number
) => ({
  lat: lerp(origin.lat, destination.lat, progress),
  lng: lerp(origin.lng, destination.lng, progress),
});

export const NavigationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [routeOrigin, setRouteOrigin] = useState({ lat: 0, lng: 0 });
  const [progress, setProgress] = useState(0);
  const [simulatedPosition, setSimulatedPosition] = useState({ lat: 0, lng: 0 });
  const [arrived, setArrived] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<ParkingReceipt | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [durationMinutes] = useState(60);
  const [reservationId, setReservationId] = useState<string | undefined>();
  const [acceptedReservation, setAcceptedReservation] = useState(false);
  const [locationReady, setLocationReady] = useState(false);

  const isMongoId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

  useEffect(() => {
    if (!id) return;

    const loadSpot = async () => {
      try {
        setIsLoading(true);
        setError('');
        setLocationReady(false); // Reset location ready state

        // If id is not a Mongo ObjectId, fall back to mock spot (for old links like /navigate/2)
        if (!isMongoId(id)) {
          const mock = MOCK_PARKING_SPOTS.find((s) => s.id === id);
          if (!mock) {
            setError('Spot not found');
            setSpot(null);
          } else {
            setSpot(mock);
          }
          return;
        }

        const data = await parking.getById(id);
        if (!data) {
          setError('Spot not found');
          setSpot(null);
          return;
        }

        const coordinates = data.location?.coordinates || [];
        const lng = typeof coordinates[0] === 'number' ? coordinates[0] : 0;
        const lat = typeof coordinates[1] === 'number' ? coordinates[1] : 0;

        const mapped: ParkingSpot = {
          id: data._id || data.id,
          name: data.name || 'Parking Spot',
          address: data.address || 'Unknown address',
          pricePerHour: data.pricePerHour ?? 0,
          occupancy:
            typeof data.totalSpots === 'number' && typeof data.availableSpots === 'number'
              ? Math.round(
                ((data.totalSpots - data.availableSpots) / Math.max(1, data.totalSpots)) *
                100
              )
              : 0,
          totalSpots: data.totalSpots ?? data.availableSpots ?? 1,
          availableSpots: data.availableSpots ?? data.totalSpots ?? 0,
          distance: typeof data.distance === 'number' ? data.distance : 0,
          type: (data.type as ParkingSpot['type']) || 'Garage',
          features: Array.isArray(data.features) ? data.features : [],
          location: { lat, lng },
        };

        setSpot(mapped);
        const initialOrigin = {
          lat: mapped.location.lat + 0.02,
          lng: mapped.location.lng - 0.02,
        };
        setRouteOrigin(initialOrigin);
        setSimulatedPosition(initialOrigin);
        setProgress(0);
        setArrived(false);
      } catch (err: any) {
        setError(err.message || 'Unable to load navigation. Please try again later.');
        setSpot(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpot();
  }, [id]);

  // Check for pending reservation
  useEffect(() => {
    if (!id) return;

    const checkPendingReservation = async () => {
      try {
        const allReservations = await reservations.list();
        // Find pending or en_route reservation for this spot
        const pending = allReservations.find((r: any) =>
          (r.status === 'pending' || r.status === 'en_route') &&
          (r.spotId?._id === id || r.spotId === id)
        );
        if (pending) {
          setReservationId(pending._id);
          if (pending.status === 'en_route') {
            setAcceptedReservation(true);
          }
        }
      } catch (err) {
        // Ignore errors - user might not have a reservation
      }
    };

    checkPendingReservation();
  }, [id]);

  const [totalDistance, setTotalDistance] = useState(0);

  // Haversine formula to calculate distance in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!spot) return;

    // Calculate initial distance based on default routeOrigin
    const dist = calculateDistance(
      routeOrigin.lat,
      routeOrigin.lng,
      spot.location.lat,
      spot.location.lng
    );
    setTotalDistance(dist);

    if (!navigator.geolocation) {
      // If geolocation is not available, proceed with default location
      setLocationReady(true);
      return;
    }

    // Set a timeout fallback in case geolocation takes too long
    const timeoutId = setTimeout(() => {
      if (!locationReady) {
        console.warn('Geolocation timeout - proceeding with default location');
        setLocationReady(true);
      }
    }, 5000); // 5 second timeout

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const nextOrigin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setRouteOrigin(nextOrigin);
        setSimulatedPosition(nextOrigin);

        // Recalculate distance from actual user location
        const newDist = calculateDistance(
          nextOrigin.lat,
          nextOrigin.lng,
          spot.location.lat,
          spot.location.lng
        );
        setTotalDistance(newDist);

        setProgress(0);
        setArrived(false);
        setLocationReady(true); // Mark location as ready
      },
      (error) => {
        clearTimeout(timeoutId);
        console.warn('Geolocation error:', error.message);
        // Proceed with default location if user denies permission or error occurs
        setLocationReady(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => clearTimeout(timeoutId);
  }, [spot]); // Removed routeOrigin dependency to avoid infinite loop

  useEffect(() => {
    if (!spot || arrived || !locationReady) return; // Wait for location to be ready
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(1, prev + 0.001); // Slower, smoother steps
        setSimulatedPosition(interpolatePosition(routeOrigin, spot.location, next));
        if (next >= 1) {
          setArrived(true);
          if (spot.pricePerHour === 0) {
            handleFreeArrival();
          } else {
            setShowPayment(true);
          }
        }
        return next;
      });
    }, 50); // 50ms updates for smooth animation

    return () => clearInterval(interval);
  }, [routeOrigin, spot, arrived, locationReady]); // Added locationReady dependency

  const handleFreeArrival = async () => {
    if (!spot) return;
    try {
      let receipt: ParkingReceipt;

      if (reservationId) {
        // Update existing pending reservation to active
        const updated = await reservations.update(reservationId, {
          status: 'active',
          durationMinutes: durationMinutes,
          paymentStatus: 'paid', // Free spots are considered paid
        });

        const durationMs = new Date(updated.endTime).getTime() - new Date(updated.startTime).getTime();
        const minutes = Math.max(1, Math.round(durationMs / 60000));

        receipt = {
          id: updated._id,
          spotId: updated.spotId._id || updated.spotId,
          spotName: updated.spotId.name || spot.name,
          address: updated.spotId.address || spot.address,
          pricePerHour: 0,
          durationMinutes: minutes,
          totalPaid: 0,
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: 'active',
        };
      } else {
        // Create new reservation for free spot
        const reservation = await parking.reserve(spot.id, durationMinutes);
        // Mark as paid/active
        const updated = await reservations.update(reservation._id, {
          paymentStatus: 'paid',
        });

        const durationMs = new Date(updated.endTime).getTime() - new Date(updated.startTime).getTime();
        const minutes = Math.max(1, Math.round(durationMs / 60000));

        receipt = {
          id: updated._id,
          spotId: updated.spotId._id || updated.spotId,
          spotName: updated.spotId.name || spot.name,
          address: updated.spotId.address || spot.address,
          pricePerHour: 0,
          durationMinutes: minutes,
          totalPaid: 0,
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: 'active',
        };
      }

      setReceipt(receipt);
      // Redirect to Parked page after successful "payment"
      setTimeout(() => navigate('/parked'), 1500);
    } catch (err) {
      console.error('Failed to process free arrival:', err);
      // Fallback to payment modal if something goes wrong, or show error
      setShowPayment(true);
    }
  };

  const handleInstantArrival = () => {
    if (!spot) return;
    setProgress(1);
    setSimulatedPosition(spot.location);
    setArrived(true);
    if (spot.pricePerHour === 0) {
      handleFreeArrival();
    } else {
      setShowPayment(true);
    }
  };

  const remainingDistance = useMemo(() => {
    if (!spot) return 0;
    return Math.max(0, totalDistance * (1 - progress));
  }, [spot, progress, totalDistance]);

  const eta = useMemo(() => {
    if (!spot) return 0;
    // Assume 30mph average speed -> 2 mins per mile
    return Math.max(1, Math.ceil(remainingDistance * 2));
  }, [remainingDistance, spot]);

  const instruction = useMemo(() => {
    if (!spot) return 'Loading...';
    if (progress >= 0.95) return `You have arrived at ${spot.name}`;
    if (progress >= 0.6) return 'Turn right in 200 ft';
    if (progress >= 0.3) return 'Continue straight for 0.5 mi';
    return 'Head towards your destination';
  }, [progress, spot]);

  // Voice Navigation Effect
  useEffect(() => {
    if (voiceEnabled && instruction && instruction !== 'Loading...') {
      // Import voiceService dynamically or use the one from props/context if available
      // For now, we'll use the imported singleton
      import('../services/voiceService').then(({ voiceService }) => {
        voiceService.speak(instruction);
      });
    }
  }, [instruction, voiceEnabled]);

  if (!spot || !locationReady) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="flex flex-col items-center gap-3">
          {!locationReady && spot && (
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          <p className="text-slate-500 text-center px-6">
            {!spot ? (error || 'Loading navigation...') : 'Getting your location...'}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold bg-white shadow-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="p-4 bg-white shadow flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100">
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900">{spot.name}</h2>
          <p className="text-xs text-slate-500">{spot.address}</p>
        </div>
        <button
          onClick={() => setVoiceEnabled((prev) => !prev)}
          className={`p-2 rounded-full border ${voiceEnabled ? 'text-blue-600 border-blue-200' : 'text-slate-400 border-slate-200'}`}
        >
          <Volume2 size={20} />
        </button>
      </div>

      <div className="relative h-1/2">
        <MapContainer
          center={[spot.location.lat, spot.location.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          doubleClickZoom={false}
        >
          <DoubleTapListener onArrive={handleInstantArrival} />
          <MapUpdater start={routeOrigin} end={spot.location} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <Polyline
            positions={[
              [routeOrigin.lat, routeOrigin.lng],
              [spot.location.lat, spot.location.lng],
            ]}
            pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.7 }}
          />
          <CircleMarker
            center={[simulatedPosition.lat, simulatedPosition.lng]}
            pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 1 }}
            radius={10}
          >
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
          </CircleMarker>
          <Marker
            position={[spot.location.lat, spot.location.lng]}
            icon={L.divIcon({
              className: 'parkly-pin parkly-pin--selected',
              html: `<span>${spot.name}</span>`,
              iconSize: [80, 40],
              iconAnchor: [40, 40],
            })}
          />
        </MapContainer>
        <button
          onClick={handleInstantArrival}
          className="absolute top-24 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-600 shadow"
        >
          Double-tap to arrive
        </button>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl p-5 space-y-5 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <NavIcon size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Primary instruction</p>
            <p className="text-lg font-bold text-slate-900">{instruction}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-slate-500 uppercase">ETA</p>
            <p className="text-2xl font-bold text-slate-900">{arrived ? 'Now' : `${eta} min`}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-slate-500 uppercase">Distance</p>
            <p className="text-2xl font-bold text-slate-900">
              {arrived ? '0.0' : remainingDistance.toFixed(1)} <span className="text-xs text-slate-400">mi</span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-slate-500 uppercase">Rate</p>
            <p className="text-2xl font-bold text-slate-900">${spot.pricePerHour}/h</p>
          </div>
        </div>

        {reservationId && !receipt && !acceptedReservation && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="text-amber-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Pending Reservation</p>
                <p className="text-xs text-amber-700">
                  {spot.pricePerHour === 0
                    ? 'Confirm your reservation to proceed'
                    : 'Accept reservation to start navigation. Payment due on arrival.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (spot.pricePerHour === 0) {
                  handleFreeArrival();
                } else {
                  // Update backend status to 'en_route'
                  reservations.update(reservationId, { status: 'en_route' })
                    .then(() => setAcceptedReservation(true))
                    .catch(err => console.error('Failed to update reservation status', err));
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              {spot.pricePerHour === 0 ? 'Confirm Reservation' : 'Accept Reservation'}
            </button>
          </div>
        )}

        {receipt ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 />
              Payment confirmed
            </div>
            <p className="text-slate-700 text-sm">
              Spot reserved until {new Date(receipt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Rate increases after expiration.
            </p>
            <button
              onClick={() => navigate('/parked')}
              className="w-full mt-2 bg-emerald-600 text-white rounded-xl py-3 font-semibold"
            >
              View receipt
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400">
            Double tap the destination on the map to complete navigation instantly.
          </p>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        spot={spot}
        durationMinutes={durationMinutes}
        reservationId={reservationId}
        onClose={() => setShowPayment(false)}
        onSuccess={(nextReceipt) => {
          setReceipt(nextReceipt);
          // Redirect to Parked page after successful payment
          setTimeout(() => navigate('/parked'), 1500);
        }}
      />
    </div>
  );
};
