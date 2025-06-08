import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const initialProjects = [
  {
    id: 1,
    title: "django_trial",
    integrations: "No apps integrated yet",
    date: "14.01.2025",
  },
  {
    id: 2,
    title: "trial",
    integrations: "GitHub",
    date: "05.06.2025",
  },
  {
    id: 3,
    title: "trialNew",
    integrations: "GitHub",
    date: "08.06.2025",
  },
];

const recentActivity = [
  {
    file: "main.js",
    message: "analyzed - 3 issues found",
    time: "2 hours ago",
  },
  {
    file: "app.py",
    message: "analyzed - 5 suggestions provided",
    time: "5 hours ago",
  },
  {
    file: "index.jsx",
    message: "analyzed - No issues detected",
    time: "1 day ago",
  },
];

export default function Dashboard({ userId = "defaultUser" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState(initialProjects);
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

  const handleDelete = (projectId) => {
    setProjects(projects.filter((project) => project.id !== projectId));
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
    <div className="min-h-screen bg-[#0C1E3C] text-white">
      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/${userId}`)}
            className="flex items-center text-white hover:text-gray-300"
          >
            <ChevronLeft className="mr-1" />
            
          </button>
          <h1 className="text-xl font-bold">Alfred.io</h1>
        </div>
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
      </div>

      {/* Content */}
      <motion.div
        className="px-8 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Create New Project Card */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 transition-all cursor-pointer h-48 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold">+</div>
              <div className="mt-2 font-medium">Create New Project</div>
            </div>
          </div>

          {/* Existing Projects */}
          {projects.map((project) => (
            <div key={project.id} className="bg-[#1F2A44] p-4 rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold uppercase mr-3">
                  {project.title[0]}
                </div>
                <h3 className="text-lg font-semibold">{project.title}</h3>
              </div>
              <div className="text-sm space-y-2">
                <div>Integrations: {project.integrations}</div>
                <div>Date: {project.date}</div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-1 rounded-md transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1F2A44] p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="space-y-4">
            {recentActivity.map((activity, index) => (
              <li key={index} className="bg-[#2A3550] p-4 rounded-md">
                <p className="text-gray-300">
                  <span className="font-semibold text-white">{activity.file}</span>{" "}
                  {activity.message}
                </p>
                <p className="text-sm text-gray-400">{activity.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}