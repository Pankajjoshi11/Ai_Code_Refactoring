import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const HeaderDashboard = ({
  projectName,
  workspaceId,
  selectedFeature,
  user,
  handleLogout,
  toggleDropdown,
  showDropdown,
  dropdownRef,
  navigate,
}) => {
  const getInitial = (email) => (email ? email.charAt(0).toUpperCase() : "?");
  const profilePhoto = user?.photoURL;
  const email = user?.email;

  const redirectPath = (basePath) => {
    if (user && user.uid) {
      return `/${user.uid}${basePath}`;
    }
    return basePath;
  };

  return (
    <div className="bg-[#15294D] px-6 py-4 flex items-center border-b border-[#1F3A6B]">
      <h2 className="text-lg font-semibold flex-1">
        {projectName} - {decodeURIComponent(workspaceId)}
      </h2>
      <div className="flex-1 text-center">
        <span className="text-lg font-semibold text-purple-300">{selectedFeature}</span>
      </div>
      <div className="flex-1 flex justify-end">
        <div className="relative" ref={dropdownRef}>
          <button onClick={toggleDropdown}>
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold">
                {getInitial(email)}
              </div>
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-50"
              >
                <ul className="py-2 text-sm">
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      navigate(redirectPath("/dashboard"));
                      toggleDropdown({ stopPropagation: () => {} });
                    }}
                  >
                    Dashboard
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      navigate("/profile");
                      toggleDropdown({ stopPropagation: () => {} });
                    }}
                  >
                    View Profile
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      handleLogout();
                      toggleDropdown({ stopPropagation: () => {} });
                    }}
                  >
                    Logout
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HeaderDashboard;