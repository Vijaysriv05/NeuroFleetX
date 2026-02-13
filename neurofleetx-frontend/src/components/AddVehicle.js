import React, { useState } from "react";

import api from "../api";

import { toast } from "react-toastify";

import {

  Database,

  Plus,

  MapPin,

  Gauge,

  Droplets,

  CreditCard,

  Users,

  Activity

} from "lucide-react";

import { motion } from "framer-motion";



const AddVehicle = ({ onAddSuccess }) => {

  const [formData, setFormData] = useState({

    model: "",

    location: "",

    status: "AVAILABLE",

    fuel: 100,

    speed: 0,

    vehicleCondition: "OPTIMAL",

    tirePressure: 32.0,

    seats: 4,

    price: 0.0

  });



  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // Sends model data to master fleet database

      await api.post("/vehicles/add", formData);

      toast.success("NODE_REGISTERED_SUCCESSFULLY");



      if (onAddSuccess) onAddSuccess();



      // Reset form to defaults

      setFormData({

        model: "", location: "", status: "AVAILABLE", fuel: 100,

        speed: 0, vehicleCondition: "OPTIMAL", tirePressure: 32.0,

        seats: 4, price: 0.0

      });

    } catch (err) {

      console.error(err);

      toast.error("DATA_COMMIT_FAILED");

    }

  };



  return (

    <motion.div

      initial={{ opacity: 0, y: 15 }}

      animate={{ opacity: 1, y: 0 }}

      className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden h-full"

    >

      {/* Decorative HUD Accent */}

      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-[60px] pointer-events-none" />



      {/* Header Section */}

      <div className="mb-8 border-b border-slate-100 pb-6 text-left">

        <div className="flex items-center gap-3 mb-1">

          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">

            <Plus size={20} strokeWidth={3} />

          </div>

          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase italic">

            Register_New_Node

          </h3>

        </div>

        <p className="text-slate-400 text-[9px] font-bold tracking-[0.2em] uppercase ml-11">

          Fleet_Uplink // MySQL_Fleet_Sync

        </p>

      </div>



      <form onSubmit={handleSubmit} className="space-y-6 text-left">

        {/* Row 1: Identity & Location */}

        <div className="grid grid-cols-2 gap-5">

          <div className="space-y-2">

            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">

              <Database size={10} /> Model_Name

            </label>

            <input

              type="text" placeholder="e.g., TATA_PRIMA"

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all italic text-sm"

              value={formData.model}

              onChange={(e) => setFormData({ ...formData, model: e.target.value })}

              required

            />

          </div>

          <div className="space-y-2">

            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">

              <MapPin size={10} /> Initial_Zone

            </label>

            <input

              type="text" placeholder="e.g., CHENNAI"

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all italic text-sm"

              value={formData.location}

              onChange={(e) => setFormData({ ...formData, location: e.target.value })}

              required

            />

          </div>

        </div>



        {/* Row 2: Commercial Metrics */}

        <div className="grid grid-cols-2 gap-5">

          <div className="space-y-2">

            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">

              <Users size={10} /> Passenger_Cap

            </label>

            <input

              type="number"

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none focus:border-emerald-500 transition-all text-sm"

              value={formData.seats}

              onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 0 })}

            />

          </div>

          <div className="space-y-2">

            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">

              <CreditCard size={10} /> Tariff ($)

            </label>

            <input

              type="number" step="0.01"

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none focus:border-emerald-500 transition-all text-sm"

              value={formData.price}

              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}

            />

          </div>

        </div>



        {/* Row 3: Status & Condition */}

        <div className="grid grid-cols-2 gap-5">

          <div className="space-y-2">

            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current_Status</label>

            <select

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none cursor-pointer appearance-none text-sm"

              value={formData.status}

              onChange={(e) => setFormData({ ...formData, status: e.target.value })}

            >

              <option value="AVAILABLE">AVAILABLE</option>

              <option value="IN_USE">IN_USE</option>

              <option value="MAINTENANCE">MAINTENANCE</option>

            </select>

          </div>

          <div className="space-y-2">

            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Condition_Rating</label>

            <select

              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none cursor-pointer appearance-none text-sm"

              value={formData.vehicleCondition}

              onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}

            >

              <option value="OPTIMAL">OPTIMAL</option>

              <option value="GOOD">GOOD</option>

              <option value="NEEDS_SERVICE">NEEDS_SERVICE</option>

            </select>

          </div>

        </div>



        {/* Row 4: Telemetry Matrix */}

        <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200">

          <div className="grid grid-cols-3 gap-4">

            <div className="space-y-2 text-center">

              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-center items-center gap-1">

                <Droplets size={8} /> Fuel %

              </label>

              <input

                type="number"

                className="w-full bg-transparent text-center text-slate-800 font-mono text-lg font-black outline-none"

                value={formData.fuel}

                onChange={(e) => setFormData({ ...formData, fuel: parseInt(e.target.value) || 0 })}

              />

            </div>

            <div className="space-y-2 text-center border-x border-slate-200">

              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-center items-center gap-1">

                <Gauge size={8} /> Speed

              </label>

              <input

                type="number"

                className="w-full bg-transparent text-center text-slate-800 font-mono text-lg font-black outline-none"

                value={formData.speed}

                onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 0 })}

              />

            </div>

            <div className="space-y-2 text-center">

              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-center items-center gap-1">

                <Activity size={8} /> PSI

              </label>

              <input

                type="number" step="0.1"

                className="w-full bg-transparent text-center text-slate-800 font-mono text-lg font-black outline-none"

                value={formData.tirePressure}

                onChange={(e) => setFormData({ ...formData, tirePressure: parseFloat(e.target.value) || 0 })}

              />

            </div>

          </div>

        </div>



        {/* Submit Action */}

        <button

          type="submit"

          className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all uppercase tracking-[0.3em] text-[10px] italic active:scale-95 group flex items-center justify-center gap-3"

        >

          <Database size={16} />

          Push_To_Database

        </button>

      </form>

    </motion.div>

  );

};



export default AddVehicle;