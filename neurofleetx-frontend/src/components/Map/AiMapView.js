import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AiMapView = ({ routeData }) => {
  // Use routeData.coordinates instead of 'data'
  const hasCoordinates = routeData && routeData.coordinates && routeData.coordinates.length > 0;

  const center = hasCoordinates
      ? [routeData.coordinates[0].lat, routeData.coordinates[0].lng]
      : [13.0827, 80.2707];

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {hasCoordinates && (
          <>
            {/* Map the array of objects to an array of Leaflet lat/lng arrays */}
            <Polyline
                positions={routeData.coordinates.map(p => [p.lat, p.lng])}
                color="#00f2fe"
                weight={5}
            />

            <Marker position={[routeData.coordinates[0].lat, routeData.coordinates[0].lng]}>
                <Popup>Start Point</Popup>
            </Marker>

            <Marker position={[routeData.coordinates[routeData.coordinates.length - 1].lat, routeData.coordinates[routeData.coordinates.length - 1].lng]}>
                <Popup>Destination</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default AiMapView;