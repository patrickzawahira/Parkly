import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Clock, CreditCard, ShieldCheck, Zap, X } from 'lucide-react';
import { parking } from '../services/api';
import { ParkingSpot } from '../types';
import { MOCK_PARKING_SPOTS } from '../services/mockData';

export const DetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [spot, setSpot] = useState<ParkingSpot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sliderValue, setSliderValue] = useState(0);
    const [isReserved, setIsReserved] = useState(false);
    const [isReserving, setIsReserving] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const isMongoId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.log('Error getting location:', error)
            );
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        const loadSpot = async () => {
            try {
                setIsLoading(true);
                setError('');
                // If id is not a Mongo ObjectId, fall back to mock spot (for old links like /details/2)
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
                        typeof data.totalSpots === 'number' &&
                            typeof data.availableSpots === 'number'
                            ? Math.round(
                                ((data.totalSpots - data.availableSpots) /
                                    Math.max(1, data.totalSpots)) *
                                100
                            )
                            : 0,
                    totalSpots: data.totalSpots ?? data.availableSpots ?? 1,
                    availableSpots: data.availableSpots ?? data.totalSpots ?? 0,
                    distance: typeof data.distance === 'number' ? data.distance : 0,
                    type: (data.type as ParkingSpot['type']) || 'Garage',
                    features: Array.isArray(data.features) ? data.features : [],
                    location: { lat, lng },
                    imageUrl: data.imageUrl || '',
                };

                setSpot(mapped);
            } catch (err: any) {
                setError(
                    err.message || 'Unable to load spot details. Please try again later.'
                );
                setSpot(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadSpot();
    }, [id]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 3959; // Radius of the earth in miles
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in miles
        return d.toFixed(1);
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Loading spot details…</p>
            </div>
        );
    }

    if (!spot) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">{error || 'Spot not found'}</p>
            </div>
        );
    }

    const holdSpot = async () => {
        if (isReserving || isReserved) return;
        setIsReserving(true);
        try {
            // Create a pending reservation for 15 minutes
            await parking.reserve(spot.id, 15, 'pending');
            setIsReserved(true);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to reserve spot';
            alert(errorMessage);
            setSliderValue(0);
        } finally {
            setIsReserving(false);
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (isReserved) return;
        setSliderValue(val);
        if (val >= 95 && !isReserving) {
            holdSpot();
        }
    };

    // Calculate dynamic distance if user location is available
    const displayDistance = spot && userLocation && spot.location
        ? calculateDistance(userLocation.lat, userLocation.lng, spot.location.lat, spot.location.lng)
        : spot?.distance || 0;

    return (
        <div className="h-full bg-slate-50 overflow-y-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white p-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="ml-2 text-xl font-bold">Details</h1>
                </div>
                <button onClick={() => navigate(-1)} className="p-2 text-slate-600 rounded-full hover:bg-slate-100">
                    <X size={24} />
                </button>
            </div>

            {/* Hero Image / Map Placeholder */}
            <div className="h-64 bg-slate-900 w-full relative">
                <img
                    src={spot.imageUrl || `https://picsum.photos/seed/${spot.id}/800/400`}
                    alt="Parking location"
                    className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <h2 className="text-white text-3xl font-bold">{spot.name}</h2>
                    <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
                        <Navigation size={14} />
                        {spot.address}
                    </p>
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
                        <p className="text-2xl font-bold text-slate-900">{displayDistance} mi</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 col-span-2 flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-sm font-medium uppercase">Open Spots</p>
                            <p className={`text-2xl font-bold ${spot.availableSpots > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {spot.availableSpots} <span className="text-sm text-slate-400 font-normal">/ {spot.totalSpots}</span>
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${spot.availableSpots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {spot.availableSpots > 0 ? 'Available' : 'Full'}
                        </div>
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
                        <p className="text-green-700 mb-4">Please go to Parked Page to accept.</p>
                        <button
                            onClick={() => navigate('/parked')}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200"
                        >
                            Go to Parked Page
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