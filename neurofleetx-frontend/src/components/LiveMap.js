import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';

/**
 * INTERNAL HELPER: MapController
 * Acts as the 'brain' of the map. It listens for focusNode or targetZone
 * changes from the Dashboard and moves the camera accordingly.
 */
const MapController = ({ focusNode, targetZone }) => {
  const map = useMap();

  useEffect(() => {
    // 1. FOCUS ON SPECIFIC VEHICLE (e.g., SOS or Tracking)
    if (focusNode && focusNode.lat && focusNode.lng) {
      map.flyTo([focusNode.lat, focusNode.lng], 14, {
        animate: true,
        duration: 1.5
      });
    }
    // 2. FOCUS ON A REGIONAL DEMAND ZONE
    else if (targetZone) {
      const zoneCoords = {
        'DOWNTOWN': [13.0827, 80.2707], // Chennai Center
        'AIRPORT': [12.9941, 80.1709],
        'INDUSTRIAL': [12.9801, 80.0579],
        'SECTOR ALPHA': [13.0475, 80.2090]
      };

      const coords = zoneCoords[targetZone.toUpperCase()];
      if (coords) {
        map.flyTo(coords, 12, {
          animate: true,
          duration: 2
        });
      }
    }
  }, [focusNode, targetZone, map]);

  return null;
};

/**
 * Custom Icon Generator
 * Creates a CSS-based pulsing marker. Red for SOS, Indigo for Normal.
 */
const createPulseIcon = (color, isCritical) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color:${color}; border: 2px solid ${isCritical ? 'white' : 'transparent'};" class="pulse-marker ${isCritical ? 'critical-pulse' : ''}"></div>`,
  iconSize: [14, 14]
});

const LiveMap = ({ focusNode, targetZone }) => {
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicleLocations = async () => {
    try {
      const res = await api.get("/vehicles/master");
      setVehicles(res.data || []);
    } catch (err) {
      console.error("Map Sync Error:", err);
    }
  };

  useEffect(() => {
    fetchVehicleLocations();
    // High-frequency polling to ensure telemetry injections show up instantly
    const interval = setInterval(fetchVehicleLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[650px] w-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0c10] shadow-2xl relative">

      {/* MAP HUD - OVERLAY INFOGRAPHICS */}
      <div className="absolute top-6 left-6 z-[1000] space-y-2 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
            <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
            Global_Geo_Sync
          </h3>
          <p className="text-[8px] text-slate-400 uppercase mt-1 font-bold">Active_Nodes: {vehicles.length}</p>
        </div>

        {focusNode && (
          <div className="bg-amber-500/20 backdrop-blur-md p-3 rounded-xl border border-amber-500/30 animate-in fade-in slide-in-from-left-4 duration-500">
            <p className="text-[9px] text-amber-500 font-black uppercase italic animate-pulse">
              Target_Lock: Node_{focusNode.id}
            </p>
          </div>
        )}
      </div>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* Dynamic Map Controller */}
        <MapController focusNode={focusNode} targetZone={targetZone} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; NeuroFleet Intelligence'
        />

        {vehicles.map((v) => {
          const isCritical = v.vehicleCondition === "CRITICAL" || Number(v.totalDistance) >= 1000;
          const markerColor = isCritical ? '#ef4444' : '#6366f1';

          return (
            <Marker
              key={v.id}
              position={[parseFloat(v.latitude) || 20.59, parseFloat(v.longitude) || 78.96]}
              icon={createPulseIcon(markerColor, isCritical)}
            >
              <Popup className="custom-popup">
                <div className="bg-[#0d1117] text-white p-3 font-sans min-w-[160px]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                    <p className="font-black italic uppercase text-indigo-500 text-[10px]">Node_{v.id}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${v.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] uppercase font-bold text-slate-400">
                      Model: <span className="text-white">{v.model}</span>
                    </p>
                    <p className="text-[9px] uppercase font-bold text-slate-400">
                      Dist: <span className={isCritical ? "text-red-500" : "text-white"}>{v.totalDistance}km</span>
                    </p>
                    <p className="text-[9px] uppercase font-bold text-slate-400">
                      Status: <span className="text-indigo-400">{v.status}</span>
                    </p>
                    <div className="pt-1 mt-1 border-t border-white/5">
                      <p className="text-[8px] text-slate-600 uppercase">Coord: {parseFloat(v.latitude).toFixed(4)}, {parseFloat(v.longitude).toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CUSTOM CSS FOR MARKERS AND POPUPS */}
      <style>{`
        .pulse-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(99, 102, 241, 0.4);
          animation: pulse 2s infinite;
          transition: all 0.3s ease;
        }
        .critical-pulse {
          animation: critical-pulse 1s infinite !important;
          box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes critical-pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.3); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .leaflet-container { background: #05070a !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          background: #0d1117;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-content { margin: 0; }
        .custom-popup .leaflet-popup-tip { background: #0d1117; border: 1px solid rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default LiveMap;