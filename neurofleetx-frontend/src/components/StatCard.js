import React from "react";

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl shadow ${color}`}>
      <div>
        <h3 className="text-gray-700 font-semibold">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-4xl text-gray-500">{icon}</div>
    </div>
  );
};

export default StatCard;
