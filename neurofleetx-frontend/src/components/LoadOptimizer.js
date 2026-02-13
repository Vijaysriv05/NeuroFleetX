import React from 'react';

const LoadOptimizer = ({ vehicles }) => {
    // AI Logic: Identify vehicles over 80% capacity
    const optimizationLogic = (load) => {
        if (load > 80) return { status: 'CRITICAL', action: 'Re-route to Large Van', color: '#ff4d4d' };
        if (load > 50) return { status: 'OPTIMAL', action: 'Maintain Route', color: '#ffec3d' };
        return { status: 'UNDER_UTILIZED', action: 'Assign More Loads', color: '#73d13d' };
    };

    return (
        <div style={{ background: '#141414', padding: '20px', borderRadius: '15px', marginTop: '20px', border: '1px solid #333' }}>
            <h3 style={{ color: '#00f2fe' }}><i className="fas fa-microchip"></i> AI_LOAD_BALANCER</h3>
            <table style={{ width: '100%', color: 'white', marginTop: '15px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Vehicle_ID</th>
                        <th>Current_Load</th>
                        <th>AI_Status</th>
                        <th>Suggested_Action</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map((v) => {
                        const advice = optimizationLogic(v.loadPercentage);
                        return (
                            <tr key={v.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '10px' }}>{v.name}</td>
                                <td>{v.loadPercentage}%</td>
                                <td style={{ color: advice.color, fontWeight: 'bold' }}>{advice.status}</td>
                                <td>
                                    <button style={{ background: 'transparent', border: `1px solid ${advice.color}`, color: advice.color, padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                                        {advice.action}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LoadOptimizer;