import React from "react";

export default function LeftSidebar({ selectedFeature, handleFeatureSelect }) {
  return (
    <div className="w-64 bg-[#15294D] p-6 flex flex-col gap-4 h-screen">
      <h1 className="text-2xl font-bold mb-6">
        Alfred.io<span className="text-purple-400">.</span>
      </h1>

      <div className="flex flex-col gap-3 text-sm">
        <div className="font-semibold text-white">Developer Tools</div>
        <div
          onClick={() => handleFeatureSelect("Programming with AI")}
          className={`px-4 py-2 rounded-md cursor-pointer ${
            selectedFeature === "Programming with AI"
              ? "bg-[#1F3A6B] text-purple-300 font-semibold"
              : "hover:bg-[#1F3A6B]"
          }`}
        >
          Programming with AI
        </div>
    

        <div className="mt-6 font-semibold text-white">Documentation Tools</div>
        <div
          onClick={() => handleFeatureSelect("AI Code Documentation")}
          className={`px-4 py-2 rounded-md cursor-pointer ${
            selectedFeature === "AI Code Documentation"
              ? "bg-[#1F3A6B] text-purple-300 font-semibold"
              : "hover:bg-[#1F3A6B]"
          }`}
        >
          AI Code Documentation
        </div>
       

        <div className="mt-6 font-semibold text-white">Integrations</div>
        <div
          onClick={() => handleFeatureSelect("Integrations")}
          className={`px-4 py-2 rounded-md cursor-pointer ${
            selectedFeature === "Integrations"
              ? "bg-[#1F3A6B] text-purple-300 font-semibold"
              : "hover:bg-[#1F3A6B]"
          }`}
        >
          Integrations
        </div>
      </div>

      
    </div>
  );
}