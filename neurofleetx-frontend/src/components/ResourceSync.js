import React from "react";
import { Zap, TrendingUp } from "lucide-react"; // Removed 'Users'

const ResourceSync = () => {
  const sectors = [
    { name: "Sector Alpha (Downtown)", demand: "High", supply: 12, trend: "+20%" },
    { name: "Sector Beta (Industrial)", demand: "Low", supply: 45, trend: "-5%" },
    { name: "Sector Gamma (Airport)", demand: "Medium", supply: 22, trend: "+12%" },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <div key={sector.name} className="bg-[#0d1117] border border-white/5 p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{sector.name}</p>
              <Zap className={sector.demand === "High" ? "text-amber-400 animate-pulse" : "text-slate-600"} size={16} />
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black italic text-white">{sector.supply} Units</h3>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
                <TrendingUp size={12} /> {sector.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black italic mb-2 uppercase text-indigo-400">Neural_Redistribution</h3>
          <p className="text-slate-400 text-sm max-w-md">
            System intelligence recommends shifting <span className="text-white font-bold">5 available units</span> from Sector Beta to Sector Alpha to optimize coverage.
          </p>
        </div>
        <button className="whitespace-nowrap bg-indigo-500 hover:bg-indigo-400 text-white font-black px-10 py-4 rounded-2xl italic uppercase tracking-tighter transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          Execute Sync
        </button>
      </div>
    </div>
  );
};

export default ResourceSync;