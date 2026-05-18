import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSpot } from '../types';
import 'leaflet/dist/leaflet.css';

type LatLng = { lat: number; lng: number };

interface ParklyMapProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  onSelect: (spotId: string) => void;
  userLocation: LatLng | null;
}

const createSpotIcon = (price: number, isSelected: boolean, hasAvailability: boolean) =>
  L.divIcon({
    className: `parkly-pin ${isSelected ? 'parkly-pin--selected' : ''} ${
      hasAvailability ? 'parkly-pin--open' : 'parkly-pin--full'
    }`,
    html: `<span>$${price.toFixed(0)}</span>`,
    iconSize: [60, 60],
    iconAnchor: [30, 58],
  });

export const ParklyMap: React.FC<ParklyMapProps> = ({
  spots,
  selectedSpotId,
  onSelect,
  userLocation,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  const fallbackCenter = spots[0]?.location || { lat: 33.8889, lng: 35.4944 }; // Lebanon center
  const center = userLocation ?? fallbackCenter;

  const bounds = useMemo(() => {
    const points = spots.map((spot) => [spot.location.lat, spot.location.lng] as [number, number]);
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }
    if (!points.length) {
      points.push([center.lat, center.lng]);
    }
    return L.latLngBounds(points);
  }, [spots, userLocation, center]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      ref={mapRef}
      style={{ height: '100%', width: '100%' }}
      doubleClickZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          pathOptions={{ color: '#1d4ed8', fillColor: '#93c5fd', fillOpacity: 0.7 }}
          radius={12}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            You
          </Tooltip>
        </CircleMarker>
      )}

      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.location.lat, spot.location.lng]}
          icon={createSpotIcon(
            spot.pricePerHour,
            selectedSpotId === spot.id,
            spot.availableSpots > 0
          )}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{spot.name}</p>
              <p className="text-sm text-slate-500">{spot.address}</p>
              <p className="text-sm font-semibold text-blue-600">${spot.pricePerHour}/hr</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

