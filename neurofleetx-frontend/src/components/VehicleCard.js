import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Gauge, Fuel, Settings,
  Trash2, Zap, Users, MapPin, ShieldAlert
} from "lucide-react";

const VehicleCard = ({ vehicle, onEdit, onDelete, onRequest, isActive, viewMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCustomerView = viewMode === "customer-dashboard";

  const getStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
      case 'IN_USE':
        return {
          bg: 'bg-white', // Changed to solid white for better contrast with border
          border: 'border-blue-400', // Darker, more visible border
          accent: 'text-blue-900', // Darker text
          badge: 'bg-blue-600 text-white shadow-sm'
        };
      case 'MAINTENANCE':
      case 'NEEDS_SERVICE':
        return {
          bg: 'bg-white',
          border: 'border-amber-500', // Darker, more visible border
          accent: 'text-amber-900', // Darker text
          badge: 'bg-amber-600 text-white shadow-sm'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-emerald-500', // Darker, more visible border
          accent: 'text-emerald-900', // Darker text
          badge: 'bg-emerald-600 text-white shadow-sm'
        };
    }
  };

  const styles = getStatusStyles(vehicle.status);

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      layout
      className={`relative rounded-[2.5rem] p-[1px] transition-all duration-300
        ${isActive ? 'bg-indigo-600 shadow-2xl scale-[1.02]' : 'bg-slate-300 shadow-lg'}`}
    >
      {/* Main Container - Added 'border-2' and used the darker styles.border */}
      <div className={`${styles.bg} backdrop-blur-xl rounded-[2.45rem] h-full overflow-hidden border-2 ${styles.border}`}>

        {/* Action Icons */}
        {!isCustomerView && (
          <div className="absolute top-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(vehicle.id); }}
              className="p-2.5 bg-white text-rose-600 hover:bg-rose-600 hover:text-white rounded-full transition-all shadow-md border border-rose-200"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex justify-between items-start">
            <div className="text-left space-y-3">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase ${styles.badge}`}>
                {vehicle.status || "READY"}
              </span>
              {/* Darkened Model Title */}
              <h4 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">
                {vehicle.model || "MODEL_X"}
              </h4>

              <div className="flex gap-2">
                 {/* Darkened inner boxes and icons */}
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-300 shadow-sm">
                   <Users size={12} className="text-slate-900" />
                   <span className="text-xs text-slate-950 font-bold">{vehicle.seats || 4}</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-300 shadow-sm">
                   <Fuel size={12} className="text-slate-900" />
                   <span className="text-xs text-slate-950 font-bold">{vehicle.fuel || 0}%</span>
                 </div>
              </div>
            </div>

            <div className={`p-2 rounded-2xl transition-all shadow-md ${isOpen ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border-2 border-slate-200'}`}>
              {isOpen ? <ChevronUp size={20} strokeWidth={3} /> : <ChevronDown size={20} strokeWidth={3} />}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest ${styles.accent}`}>
               <MapPin size={12} strokeWidth={3} className="text-slate-900" />
               {/* Darkened ID box */}
               <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-400 shadow-sm text-slate-950">ID // {vehicle.id}</span>
            </div>
            {/* Darkened Version Text */}
            <div className="text-[10px] font-black text-slate-900 tracking-widest">
                VER // 4.2
            </div>
          </div>
        </div>

        {/* Expanded Info */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pb-8 space-y-6"
            >
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-6">
                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Gauge size={12} /> Velocity
                  </p>
                  <p className="text-xl font-black text-slate-950 font-mono italic">{vehicle.speed || 0} <span className="text-[10px]">KM/H</span></p>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(vehicle.speed / 200) * 100}%` }} className="h-full bg-indigo-600" />
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={12} /> Stability
                  </p>
                  <p className="text-xl font-black text-slate-950 font-mono italic">OPTIMAL</p>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-300">
                    <div className="h-full bg-emerald-600 w-[92%]" />
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); isCustomerView ? onRequest(vehicle) : onEdit(vehicle); }}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.2em] text-[10px] italic transition-all shadow-lg
                  ${isCustomerView ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200' : 'bg-slate-900 hover:bg-black shadow-slate-300'}`}
              >
                {isCustomerView ? <Zap size={16} fill="white" /> : <Settings size={16} />}
                {isCustomerView ? 'Initiate_Uplink' : 'Reconfigure_Node'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VehicleCard;