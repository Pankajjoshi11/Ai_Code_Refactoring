import React from 'react';
import TrialIntegration from './TrialIntegration';

const Integrations = ({ selectedFeature, handleFeatureSelect, user, handleLogout, toggleDropdown, showDropdown, dropdownRef }) => {
  return (
    <div className="min-h-screen bg-[#0C1E3C] text-white p-6">
      <TrialIntegration />
    </div>
  );
};

export default Integrations;