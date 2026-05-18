import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { ParklyLogo } from '../components/ParklyLogo';
import { owner } from '../services/api';
import 'leaflet/dist/leaflet.css';

// ... (existing imports)

// Search component to fly to location
const LocationSearch = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 13);
      } else {
        alert('Location not found');
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-lg shadow-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search country or city..."
          className="border border-slate-300 rounded px-2 py-1 text-sm w-48"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? '...' : 'Go'}
        </button>
      </div>
    </div>
  );
};

const LocationPickerMap: React.FC<{
  value: LatLng | null;
  onChange: (next: LatLng) => void;
}> = ({ value, onChange }) => {
  const defaultCenter: LatLng = value || { lat: 37.7891, lng: -122.4011 }; // default to SF area

  const ClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      doubleClickZoom={false}
    >
      <LocationSearch />
      <ClickHandler />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      {value && <Marker position={[value.lat, value.lng]} />}
    </MapContainer>
  );
};
const WEEKLY_DATA = [
  { name: 'Mon', occupancy: 65, revenue: 1200 },
  { name: 'Tue', occupancy: 75, revenue: 1350 },
  { name: 'Wed', occupancy: 85, revenue: 1600 },
  { name: 'Thu', occupancy: 80, revenue: 1500 },
  { name: 'Fri', occupancy: 95, revenue: 2100 },
  { name: 'Sat', occupancy: 60, revenue: 1800 },
  { name: 'Sun', occupancy: 40, revenue: 900 },
];

interface OwnerSpot {
  _id: string;
  name: string;
  address: string;
  pricePerHour: number;
  totalSpots: number;
  imageUrl?: string;
}

interface SpotAnalytics {
  spot: {
    id: string;
    name: string;
    address: string;
    pricePerHour: number;
    totalSpots: number;
    imageUrl?: string;
  };
  metrics: {
    totalProfit: number;
    activeCount: number;
    totalReservations: number;
  };
  parkers: Array<{
    id: string;
    userName: string;
    userEmail: string;
    startTime: string;
    endTime: string;
    totalPaid: number;
    status: string;
    paymentStatus: string;
  }>;
}

type LatLng = { lat: number; lng: number };

export const AnalyticsPage: React.FC = () => {
  const [ownerSpots, setOwnerSpots] = useState<OwnerSpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SpotAnalytics | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [ownerError, setOwnerError] = useState('');

  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotAddress, setNewSpotAddress] = useState('');
  const [newSpotLat, setNewSpotLat] = useState('');
  const [newSpotLng, setNewSpotLng] = useState('');
  const [newSpotPrice, setNewSpotPrice] = useState('');
  const [newSpotTotalSpots, setNewSpotTotalSpots] = useState('10');
  const [newSpotImageUrl, setNewSpotImageUrl] = useState('');
  const [featureEV, setFeatureEV] = useState(false);
  const [featureAccessible, setFeatureAccessible] = useState(false);
  const [featureFree, setFeatureFree] = useState(false);
  const [creatingSpot, setCreatingSpot] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal' | 'apple_pay' | 'google_pay'>('card');
  const [pendingSpotData, setPendingSpotData] = useState<any>(null);

  // Edit mode state
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // User role check
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    // Check user role from session
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      try {
        const user = JSON.parse(userSession);
        setUserRole(user.role || 'user');
      } catch (e) {
        setUserRole('user');
      }
    }
  }, []);

  const loadOwnerSpots = async () => {
    try {
      setIsLoadingOwner(true);
      setOwnerError('');
      const spots = await owner.mySpots();
      setOwnerSpots(spots);

      // Fallback: If we successfully loaded spots, the user MUST be an owner
      if (spots) {
        setUserRole('spot_owner');
      }

      if (spots.length && !selectedSpotId) {
        setSelectedSpotId(spots[0]._id);
      }
    } catch (err: any) {
      // Don't show error if it's just a 403 (not owner)
      if (err.response?.status !== 403) {
        setOwnerError(err.message || 'Unable to load owned spots. Make sure you are logged in as a Spot Owner with an active subscription.');
      }
      setOwnerSpots([]);
    } finally {
      setIsLoadingOwner(false);
    }
  };

  useEffect(() => {
    loadOwnerSpots();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedSpotId) {
        setAnalytics(null);
        return;
      }
      try {
        const data = await owner.spotAnalytics(selectedSpotId);
        setAnalytics(data);
      } catch {
        // swallow for now, already surfaced in ownerError if permissions issue
      }
    };

    loadAnalytics();
  }, [selectedSpotId]);

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingSpot) return;

    try {
      setOwnerError('');

      if (!selectedLocation) {
        setOwnerError('Tap on the map to choose the spot location.');
        return;
      }

      const { lat, lng } = selectedLocation;
      const pricePerHour = parseFloat(newSpotPrice);
      const totalSpots = parseInt(newSpotTotalSpots || '10', 10);

      if (Number.isNaN(pricePerHour)) {
        setOwnerError('Price per hour must be a valid number.');
        return;
      }

      const features: string[] = [];
      if (featureEV) features.push('EV Charging');
      if (featureAccessible) features.push('Disabled');
      if (featureFree) features.push('Free');

      // Store the spot data and show payment modal
      setPendingSpotData({
        name: newSpotName,
        address: newSpotAddress,
        lat,
        lng,
        pricePerHour,
        totalSpots,
        features,
        imageUrl: newSpotImageUrl || undefined,
      });

      setShowPaymentModal(true);
    } catch (err: any) {
      setOwnerError(err.message || 'Failed to validate spot data.');
    }
  };

  const handlePaymentConfirm = async () => {
    if (!pendingSpotData) return;

    try {
      setCreatingSpot(true);
      setOwnerError('');

      await owner.createSpot(pendingSpotData);

      // Clear form
      setNewSpotName('');
      setNewSpotAddress('');
      setNewSpotLat('');
      setNewSpotLng('');
      setNewSpotPrice('');
      setNewSpotTotalSpots('10');
      setNewSpotImageUrl('');
      setFeatureEV(false);
      setFeatureAccessible(false);
      setFeatureFree(false);
      setSelectedLocation(null);
      setPendingSpotData(null);
      setShowPaymentModal(false);

      await loadOwnerSpots();
    } catch (err: any) {
      setOwnerError(err.message || 'Failed to create spot. Ensure you are a Spot Owner with an active subscription.');
    } finally {
      setCreatingSpot(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingSpotData(null);
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this parking spot?')) {
      return;
    }

    try {
      setOwnerError('');
      await owner.deleteSpot(spotId);
      if (selectedSpotId === spotId) {
        setSelectedSpotId(null);
      }
      await loadOwnerSpots();
    } catch (err: any) {
      setOwnerError(err.message || 'Failed to delete spot');
    }
  };

  const handleEditSpot = (spot: OwnerSpot) => {
    setEditingSpotId(spot._id);
    setEditFormData({
      name: spot.name,
      address: spot.address,
      pricePerHour: spot.pricePerHour,
      totalSpots: spot.totalSpots || 1,
      imageUrl: spot.imageUrl || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSpotId || !editFormData) return;

    try {
      setOwnerError('');
      await owner.updateSpot(editingSpotId, {
        name: editFormData.name,
        address: editFormData.address,
        pricePerHour: parseFloat(editFormData.pricePerHour),
        totalSpots: parseInt(editFormData.totalSpots, 10),
        imageUrl: editFormData.imageUrl,
      });
      setEditingSpotId(null);
      setEditFormData(null);
      await loadOwnerSpots();
    } catch (err: any) {
      setOwnerError(err.message || 'Failed to update spot');
    }
  };

  const handleCancelEdit = () => {
    setEditingSpotId(null);
    setEditFormData(null);
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-20 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <ParklyLogo
          size={48}
          textClassName="text-slate-900"
          subtitle="Insight hub"
        />
        <div className="text-right text-xs text-slate-400 uppercase tracking-[0.3em]">
          Trusted by Parkly Ops
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 text-slate-700">Weekly Occupancy (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: "#ffffff",
                    color: "#1e293b"
                  }}
                />
                <Bar dataKey="occupancy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 text-slate-700">Revenue Estimate ($)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: "#ffffff",
                    color: "#1e293b"
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spot owner tools - Only show for spot_owner role */}
        {userRole === 'spot_owner' ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Spot Owner Console</h2>
            {ownerError && (
              <p className="text-sm text-red-500 mb-3">{ownerError}</p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Create spot form */}
              <form onSubmit={handleCreateSpot} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Create new spot
                </h3>
                <input
                  type="text"
                  placeholder="Spot name"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newSpotAddress}
                  onChange={(e) => setNewSpotAddress(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Latitude (click on map)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={newSpotLat}
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="Longitude (click on map)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={newSpotLng}
                    readOnly
                  />
                </div>
                <div className="h-40 rounded-xl overflow-hidden border border-slate-200 relative z-0">
                  <LocationPickerMap
                    value={selectedLocation}
                    onChange={(next) => {
                      setSelectedLocation(next);
                      setNewSpotLat(next.lat.toFixed(6));
                      setNewSpotLng(next.lng.toFixed(6));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="Price per hour"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={newSpotPrice}
                    onChange={(e) => setNewSpotPrice(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Total spots"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={newSpotTotalSpots}
                    onChange={(e) => setNewSpotTotalSpots(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={newSpotImageUrl}
                  onChange={(e) => setNewSpotImageUrl(e.target.value)}
                />
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featureEV}
                      onChange={(e) => setFeatureEV(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span>EV Charger</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featureAccessible}
                      onChange={(e) => setFeatureAccessible(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span>Accessible</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featureFree}
                      onChange={(e) => setFeatureFree(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span>Free</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={creatingSpot}
                  className="w-full text-sm font-semibold rounded-lg bg-blue-600 text-white py-2.5 hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingSpot ? 'Creating…' : 'Create spot'}
                </button>
              </form>

              {/* Owned spots + analytics */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Your spots & performance
                </h3>
                {isLoadingOwner ? (
                  <p className="text-sm text-slate-500">Loading your spots…</p>
                ) : ownerSpots.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No owned spots yet. Create your first spot to start tracking visitors and revenue.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {ownerSpots.map((spot) => (
                          <div key={spot._id} className="relative">
                            <button
                              onClick={() => setSelectedSpotId(spot._id)}
                              className={`px-3 py-2 rounded-xl border text-xs text-left whitespace-nowrap ${selectedSpotId === spot._id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                            >
                              <div className="font-semibold">{spot.name}</div>
                              <div className="text-[11px] text-slate-500">
                                ${spot.pricePerHour}/h • {spot.totalSpots} spots
                              </div>
                            </button>
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => handleEditSpot(spot)}
                                className="flex-1 px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSpot(spot._id)}
                                className="flex-1 px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Edit Form */}
                      {editingSpotId && editFormData && (
                        <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
                          <h4 className="text-sm font-semibold text-blue-900">Edit Spot</h4>
                          <input
                            type="text"
                            placeholder="Spot name"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Address"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            value={editFormData.address}
                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="Price per hour"
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                              value={editFormData.pricePerHour}
                              onChange={(e) => setEditFormData({ ...editFormData, pricePerHour: e.target.value })}
                            />
                            <input
                              type="number"
                              min={1}
                              placeholder="Total spots"
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                              value={editFormData.totalSpots}
                              onChange={(e) => setEditFormData({ ...editFormData, totalSpots: e.target.value })}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Image URL (optional)"
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                            value={editFormData.imageUrl}
                            onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {analytics && (
                      <div className="border border-slate-100 rounded-xl p-3 text-xs space-y-3">
                        <div className="flex items-center gap-3">
                          {analytics.spot.imageUrl && (
                            <img
                              src={analytics.spot.imageUrl}
                              alt={analytics.spot.name}
                              className="w-14 h-14 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">
                              {analytics.spot.name}
                            </div>
                            <div className="text-slate-500">
                              ${analytics.spot.pricePerHour}/h • {analytics.spot.totalSpots} spots • {analytics.metrics.totalReservations} bookings
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-500 uppercase">Profit</div>
                            <div className="text-sm font-semibold text-emerald-600">
                              ${analytics.metrics.totalProfit.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-500 uppercase">Active</div>
                            <div className="text-sm font-semibold text-slate-800">
                              {analytics.metrics.activeCount}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-slate-500 uppercase">Total</div>
                            <div className="text-sm font-semibold text-slate-800">
                              {analytics.metrics.totalReservations}
                            </div>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto border-t border-slate-100 pt-2">
                          {analytics.parkers.length === 0 ? (
                            <p className="text-slate-500">No parkers yet.</p>
                          ) : (
                            analytics.parkers.map((p) => (
                              <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-b-0">
                                <div>
                                  <div className="font-semibold text-slate-800">
                                    {p.userName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {new Date(p.startTime).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-slate-800">
                                    ${p.totalPaid.toFixed(2)}
                                  </div>
                                  <div className="text-[11px] text-slate-500 capitalize">
                                    {p.status} • {p.paymentStatus}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Spot Owner Console</h2>
            <p className="text-sm text-slate-500">
              This section is only available for Spot Owners. Please register as a Spot Owner to create and manage parking spots.
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Complete Payment</h2>
            <p className="text-sm text-slate-600">
              Pay the spot creation fee to publish your parking spot
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-sm text-blue-700 font-medium">Spot Creation Fee</div>
              <div className="text-3xl font-bold text-blue-900">$100.00</div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedPaymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedPaymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  🅿️ PayPal
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('apple_pay')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedPaymentMethod === 'apple_pay'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  🍎 Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('google_pay')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedPaymentMethod === 'google_pay'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                  🔵 Google Pay
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handlePaymentCancel}
                disabled={creatingSpot}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePaymentConfirm}
                disabled={creatingSpot}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingSpot ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};