import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { ClipboardList } from 'lucide-react';

const MaintenanceHistory = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get("/manager/maintenance-history");
            setLogs(res.data);
        } catch (err) {
            console.error("History Sync Error", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
        // High-frequency sync for real-time monitoring
        const interval = setInterval(fetchHistory, 3000);
        return () => clearInterval(interval);
    }, [fetchHistory]);

    return (
        <div className="p-6 bg-[#0d1117] rounded-[2rem] border border-white/5 shadow-2xl">
            <h3 className="text-xl font-black text-white italic uppercase mb-8 flex items-center gap-2">
                <ClipboardList className="text-indigo-500" /> SERVICE_ARCHIVE_LOGS
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                            <th className="px-6 pb-2">Timestamp</th>
                            <th className="px-6 pb-2">Unit_Node</th>
                            <th className="px-6 pb-2">Service_By</th>
                            <th className="px-6 pb-2">Last_Odometer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="bg-white/5 hover:bg-white/10 transition-colors group">
                                <td className="px-6 py-4 rounded-l-2xl font-mono text-xs text-indigo-400">
                                    {new Date(log.serviceTimestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold">{log.model}</span>
                                        <span className="text-[10px] text-slate-500 font-black">ID: {log.vehicleId}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-bold uppercase italic text-sm">
                                    {log.operatorName.split('@')[0]}
                                </td>
                                <td className="px-6 py-4 rounded-r-2xl font-black text-emerald-500 italic">
                                    {log.distanceAtService?.toFixed(1)} KM
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && !isLoading && (
                    <p className="text-center py-10 text-slate-600 font-black italic uppercase">
                        DATABASE_EMPTY: NO_SERVICE_RECORDS_FOUND
                    </p>
                )}
            </div>
        </div>
    );
};

export default MaintenanceHistory;