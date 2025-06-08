import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ isDashboard = false }) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      alert("Logged out successfully!");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  const getInitial = (email) => (email ? email.charAt(0).toUpperCase() : "?");

  const redirectPath = (basePath) => {
    if (user && user.uid) {
      return `/${user.uid}${basePath}`;
    }
    return basePath;
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  const profilePhoto = user?.photoURL;
  const email = user?.email;

  return (
    <>
      {/* Navbar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-4">
          {isDashboard && (
            <button
              onClick={() => navigate(userId ? `/${userId}` : "/")}
              className="text-white hover:text-purple-400"
            >
              ←
            </button>
          )}
          <h1 className="text-white text-2xl font-bold">{isDashboard ? "Workik" : "Alfred.io"}</h1>
        </div>

        {/* Desktop Menu Centered (only shown on non-dashboard pages) */}
        {!isDashboard && (
          <div className="hidden md:flex flex-1 justify-center items-center gap-10">
            <button className="text-white hover:text-purple-400" onClick={() => navigate(redirectPath("/upload"))}>
              Use Tool
            </button>
            <button className="text-white hover:text-purple-400" onClick={() => navigate("/features")}>
              Features
            </button>
            <button className="text-white hover:text-purple-400" onClick={() => navigate(redirectPath("/playground"))}>
              Playground
            </button>
          </div>
        )}

        {/* Profile Section */}
        <div className="hidden md:flex items-center">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={toggleDropdown}>
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">
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
                          setShowDropdown(false);
                        }}
                      >
                        Dashboard
                      </li>
                      <li
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          navigate("/profile");
                          setShowDropdown(false);
                        }}
                      >
                        View Profile
                      </li>
                      <li
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleLogout();
                          setShowDropdown(false);
                        }}
                      >
                        Logout
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md font-medium hover:scale-105 transition"
            >
              Login / Sign Up
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle (only shown on non-dashboard pages) */}
        {!isDashboard && (
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Panel (only shown on non-dashboard pages) */}
      {!isDashboard && (
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 md:hidden px-6 pb-4 bg-black/90 text-white backdrop-blur-md"
            >
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate(redirectPath("/upload"))} className="text-left hover:text-purple-400">
                  Use Tool
                </button>
                <button onClick={() => navigate("/features")} className="text-left hover:text-purple-400">
                  Features
                </button>
                <button onClick={() => navigate(redirectPath("/playground"))} className="text-left hover:text-purple-400">
                  Playground
                </button>
                {user ? (
                  <>
                    <button onClick={() => navigate(redirectPath("/dashboard"))} className="text-left hover:text-purple-400">
                      Dashboard
                    </button>
                    <button onClick={() => navigate("/profile")} className="text-left hover:text-purple-400">
                      View Profile
                    </button>
                    <button onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }} className="text-left hover:text-red-400">
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="text-left hover:text-purple-400"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}