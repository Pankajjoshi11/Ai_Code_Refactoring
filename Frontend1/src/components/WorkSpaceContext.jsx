import React from 'react';

const WorkSpaceContext = () => {
  return (
    <div className="w-1/4 p-8 border-l border-[#1F3A6B]">
      <h4 className="text-white mb-4 text-lg font-semibold">Workspace Context</h4>
      <div className="bg-[#1F3A6B] p-6 rounded-lg text-center">
        <p className="text-gray-300 mb-4">No context added yet</p>
        <button className="px-4 py-2 bg-purple-500 rounded-md text-white hover:bg-purple-600">
          + Add context
        </button>
      </div>
    </div>
  );
};

export default WorkSpaceContext;