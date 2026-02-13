import React, { useEffect, useState } from 'react';

import { MapContainer, TileLayer, useMap, Marker, Polyline } from 'react-leaflet';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

import 'leaflet-geosearch/dist/geosearch.css';



// --- ICONS CONFIGURATION ---

const CAR_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/854/854838.png';



const createCarIcon = (angle) => L.divIcon({

    html: `<div style="transform: rotate(${angle}deg); transition: transform 0.1s linear;">

            <img src="${CAR_ICON_URL}" style="width: 40px; height: 40px; filter: drop-shadow(0px 0px 15px rgba(99, 102, 241, 0.4));" />

           </div>`,

    iconSize: [40, 40],

    iconAnchor: [20, 20],

});



const srcIcon = L.icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',

    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]

});



const destIcon = L.icon({

    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',

    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]

});



// --- STABLE SEARCH COMPONENT ---

const SearchField = ({ setPos, setName, placeholder, id }) => {

    const map = useMap();



    useEffect(() => {

        if (!map) return;



        const provider = new OpenStreetMapProvider();

        const searchControl = new GeoSearchControl({

            provider,

            style: 'bar',

            showMarker: false,

            autoClose: true,

            placeholder: placeholder,

            keepResult: true,

            classNames: {

                container: `leaflet-geosearch-button-${id}`

            }

        });



        map.addControl(searchControl);



        const handleResult = (result) => {

            const container = searchControl.getContainer();

            if (container && container.contains(document.activeElement)) {

                setPos([result.location.y, result.location.x]);

                setName(result.location.label.split(',')[0]);

            }

        };



        map.on('geosearch/showlocation', handleResult);



        return () => {

            map.off('geosearch/showlocation', handleResult);

            if (map && searchControl) {

                try {

                    map.removeControl(searchControl);

                } catch (e) {

                    // Prevents "removeLayer of null" runtime crash

                    console.warn("Clean-up: searchControl already removed.");

                }

            }

        };

    }, [map, setPos, setName, placeholder, id]);



    return null;

};



// --- MAIN COMPONENT ---

const RouteOptimizer = () => {

    const [start, setStart] = useState([13.0827, 80.2707]);

    const [end, setEnd] = useState([12.9716, 77.5946]);

    const [startName, setStartName] = useState("Chennai");

    const [endName, setEndName] = useState("Bengaluru");



    const [polyline, setPolyline] = useState([]);

    const [carPos, setCarPos] = useState(null);

    const [angle, setAngle] = useState(0);

    const [isMoving, setIsMoving] = useState(false);

    const [isLoading, setIsLoading] = useState(false);



    // Fetch route line when start or end changes

    useEffect(() => {

        let isSubscribed = true;

        const getRoute = async () => {

            setIsLoading(true);

            try {

                const response = await fetch(

                    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`

                );

                const data = await response.json();

                if (isSubscribed && data.routes && data.routes[0]) {

                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

                    setPolyline(coords);

                    setCarPos(coords[0]);

                }

            } catch (error) {

                console.error("OSRM Fetch Error:", error);

            } finally {

                if (isSubscribed) setIsLoading(false);

            }

        };

        getRoute();

        return () => { isSubscribed = false; };

    }, [start, end]);



    const startSimulation = () => {

        if (polyline.length === 0 || isMoving) return;

        setIsMoving(true);

        let i = 0;

        const speed = 2;



        const interval = setInterval(() => {

            if (i >= polyline.length - 1) {

                clearInterval(interval);

                setIsMoving(false);

                setCarPos(polyline[polyline.length - 1]);

                return;

            }



            const p1 = polyline[i];

            const p2 = polyline[i + 1];



            if (p1 && p2) {

                const newAngle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

                setAngle(newAngle + 90);

                setCarPos(p1);

            }

            i += speed;

        }, 30);

    };



    return (

        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-800">

            <div className="flex justify-between items-center mb-8">

                <div>

                    <h3 className="text-white font-black italic tracking-tighter text-2xl uppercase">NeuroX_Navigator_V4</h3>

                    <div className="flex items-center gap-2 mt-1">

                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">

                            {isLoading ? 'Syncing_Neural_Path...' : `System_Ready: ${startName} ➔ ${endName}`}

                        </p>

                    </div>

                </div>

                <button

                    onClick={startSimulation}

                    disabled={isMoving || isLoading || polyline.length === 0}

                    className={`px-10 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all

                        ${isMoving || isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}

                >

                    {isMoving ? 'Executing_Run...' : 'Initialize_Sim'}

                </button>

            </div>



            <div className="h-[550px] rounded-[2.5rem] overflow-hidden border-8 border-slate-800 relative shadow-inner">

                {isLoading && (

                    <div className="absolute inset-0 z-[1001] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center text-center">

                        <div className="bg-slate-900 px-6 py-3 rounded-full border border-indigo-500/50 text-indigo-400 font-bold text-[10px] tracking-widest animate-pulse uppercase">

                            Calculating_Neural_Path...

                        </div>

                    </div>

                )}



                <MapContainer

                    center={start}

                    zoom={7}

                    className="h-full w-full"

                    style={{ background: '#111827' }}

                >

                    <TileLayer

                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

                        attribution='&copy; OpenStreetMap'

                    />



                    <SearchField

                        id="src"

                        setPos={setStart}

                        setName={setStartName}

                        placeholder="1. Enter Origin Address..."

                    />

                    <SearchField

                        id="dest"

                        setPos={setEnd}

                        setName={setEndName}

                        placeholder="2. Enter Destination Address..."

                    />



                    <Marker position={start} icon={srcIcon} />

                    <Marker position={end} icon={destIcon} />



                    {carPos && (

                        <Marker

                            position={carPos}

                            icon={createCarIcon(angle)}

                            zIndexOffset={1000}

                        />

                    )}



                    {polyline.length > 0 && (

                        <Polyline

                            positions={polyline}

                            pathOptions={{

                                color: '#6366f1',

                                weight: 5,

                                opacity: 0.8,

                                lineJoin: 'round',

                                dashArray: isMoving ? '0' : '5, 10'

                            }}

                        />

                    )}

                </MapContainer>

            </div>

        </div>

    );

};



export default RouteOptimizer;