import React from 'react';
import { useNavigate } from 'react-router-dom';

const LeftSidebar = ({ selectedFeature, handleFeatureSelect, userId, projectId, workspaceId }) => {
  const navigate = useNavigate();

  const features = [
    { name: "Programming with AI", icon: "💻" },
    { name: "Integrations", icon: "🔗" },
    // Add other features as needed
  ];

  const handleClick = (feature) => {
    if (feature === "Integrations") {
      navigate(`/${userId}/project/${projectId}/workspace/${workspaceId}/integrations`);
    } else {
      handleFeatureSelect(feature);
    }
  };

  return (
    <div className="w-64 bg-[#15294D] border-r border-[#1F3A6B] flex flex-col">
      <div className="p-6 border-b border-[#1F3A6B]">
        <h1 className="text-xl font-bold text-white">Alfred.io</h1>
      </div>
      <div className="flex-1 p-4">
        {features.map((feature) => (
          <button
            key={feature.name}
            onClick={() => handleClick(feature.name)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm mb-2 transition-all ${
              selectedFeature === feature.name
                ? 'bg-[#1F3A6B] text-white'
                : 'text-gray-300 hover:bg-[#1F3A6B] hover:text-white'
            }`}
          >
            <span>{feature.icon}</span>
            <span>{feature.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeftSidebar;