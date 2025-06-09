import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { db } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "firebase/firestore";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId } = useParams(); // Extract userId from URL
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showWorkspaceOptionsModal, setShowWorkspaceOptionsModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newWorkspaces, setNewWorkspaces] = useState([""]);
  const [newProjectData, setNewProjectData] = useState(null);
  const dropdownRef = useRef();

  // Fetch projects from Firestore for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "projects"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, [user]);

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

  const handleDelete = async (projectId) => {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setShowDeletePopup(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project.");
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeletePopup(true);
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setProjectToDelete(null);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName || newWorkspaces.some(workspace => !workspace.trim())) {
      alert("Please fill in all fields.");
      return;
    }

    const projectData = {
      projectId: Date.now().toString(),
      userId: user.uid,
      projectName: newProjectName,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).replace(/\//g, "."), // Format: DD.MM.YYYY (e.g., 09.06.2025)
      integrations: [],
      workspaces: newWorkspaces.filter(workspace => workspace.trim()),
    };

    setNewProjectData(projectData);
    setShowCreateProjectModal(false);
    setShowWorkspaceOptionsModal(true);
  };

  const handleWorkspaceOption = async (option) => {
    if (!newProjectData) return;

    try {
      await addDoc(collection(db, "projects"), newProjectData);
      if (option === "open" && newProjectData.workspaces.length > 0) {
        // Redirect to the first workspace
        const workspaceId = encodeURIComponent(newProjectData.workspaces[0]);
        navigate(`/${user.uid}/workspace/${workspaceId}`);
      } else {
        setShowWorkspaceOptionsModal(false);
      }
      setNewProjectName("");
      setNewWorkspaces([""]);
      setNewProjectData(null);
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
      alert("Failed to create project.");
    }
  };

  const handleProjectClick = (project) => {
    if (project.workspaces.length > 0) {
      const workspaceId = encodeURIComponent(project.workspaces[0]);
      navigate(`/${user.uid}/workspace/${workspaceId}`);
    } else {
      alert("This project has no workspaces.");
    }
  };

  const addWorkspaceInput = () => {
    setNewWorkspaces([...newWorkspaces, ""]);
  };

  const updateWorkspace = (index, value) => {
    const updatedWorkspaces = [...newWorkspaces];
    updatedWorkspaces[index] = value;
    setNewWorkspaces(updatedWorkspaces);
  };

  const removeWorkspaceInput = (index) => {
    if (newWorkspaces.length === 1) return;
    setNewWorkspaces(newWorkspaces.filter((_, i) => i !== index));
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

  const displayIntegrations = (integrations) => {
    if (Array.isArray(integrations)) {
      return integrations.length > 0 ? integrations.join(", ") : "No apps integrated yet";
    }
    return integrations || "No apps integrated yet";
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
          <div
            onClick={() => setShowCreateProjectModal(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 transition-all cursor-pointer h-48 flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <div className="text-3xl font-bold">+</div>
              <div className="mt-2 font-medium">Create New Project</div>
            </div>
          </div>

          {/* Existing Projects */}
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="bg-[#1F2A44] p-4 rounded-2xl cursor-pointer hover:bg-[#2A3550] transition-all"
            >
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold uppercase mr-3">
                  {project.projectName[0]}
                </div>
                <h3 className="text-lg font-semibold">{project.projectName}</h3>
              </div>
              <div className="text-sm space-y-2">
                <div>Integrations: {displayIntegrations(project.integrations)}</div>
                <div>Date: {project.date}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent project click from triggering
                    handleDeleteClick(project);
                  }}
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

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {showDeletePopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={handleCancelDelete}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F2A44] p-6 rounded-md shadow-lg z-50 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Are you sure that you want to delete {projectToDelete?.projectName}?
              </h3>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(projectToDelete.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateProjectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowCreateProjectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F2A44] p-6 rounded-md shadow-lg z-50 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Workspaces
                  </label>
                  {newWorkspaces.map((workspace, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={workspace}
                        onChange={(e) => updateWorkspace(index, e.target.value)}
                        className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={`Workspace ${index + 1}`}
                      />
                      {newWorkspaces.length > 1 && (
                        <button
                          onClick={() => removeWorkspaceInput(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addWorkspaceInput}
                    className="text-purple-500 hover:text-purple-400 text-sm"
                  >
                    + Add another workspace
                  </button>
                </div>
                <button
                  onClick={handleCreateProject}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 text-white font-medium rounded-md transition-all"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workspace Options Modal */}
      <AnimatePresence>
        {showWorkspaceOptionsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowWorkspaceOptionsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F2A44] p-6 rounded-md shadow-lg z-50 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Choose Workspace Option</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleWorkspaceOption("open")}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-all"
                >
                  Create Open Workspace
                </button>
                <hr className="border-gray-600" />
                <button
                  onClick={() => handleWorkspaceOption("templates")}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-all"
                >
                  Create from Templates
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}