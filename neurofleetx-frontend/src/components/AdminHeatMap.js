import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; // Import the heat plugin
import 'leaflet/dist/leaflet.css';

// Helper component to add the heat layer to the map instance
const HeatLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        // Format: [lat, lng, intensity]
        const heatPoints = points.map(p => [p.lat, p.lng, p.intensity || 0.5]);

        const heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => map.removeLayer(heatLayer); // Cleanup on unmount
    }, [map, points]);

    return null;
};

const AdminHeatMap = ({ data }) => {
    const center = [12.9716, 77.5946]; // Your city center

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
            <MapContainer center={center} zoom={12} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <HeatLayer points={data} />
            </MapContainer>
        </div>
    );
};

export default AdminHeatMap;