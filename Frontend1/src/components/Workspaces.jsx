import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { query, collection, where, onSnapshot } from "firebase/firestore";

export default function Workspaces() {
  const navigate = useNavigate();
  const { userId, workspaceId } = useParams();
  const [project, setProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [error, setError] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState("Programming with AI");

  // Fetch the project containing this workspace
  useEffect(() => {
    if (!userId || !workspaceId) return;

    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("workspaces", "array-contains", decodeURIComponent(workspaceId))
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setError("Workspace or project not found.");
          return;
        }
        const projectDoc = snapshot.docs[0];
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      },
      (err) => {
        console.error("Error fetching project:", err);
        setError("Failed to load workspace.");
      }
    );

    return () => unsubscribe();
  }, [userId, workspaceId]);

  const handleEditWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Please enter a workspace name.");
      return;
    }

    if (!project) return;

    try {
      const updatedWorkspaces = project.workspaces.map((ws) =>
        ws === decodeURIComponent(workspaceId) ? newWorkspaceName : ws
      );
      await updateDoc(doc(db, "projects", project.id), {
        workspaces: updatedWorkspaces,
      });
      setShowEditModal(false);
      setNewWorkspaceName("");
      navigate(`/${userId}/workspace/${encodeURIComponent(newWorkspaceName)}`);
    } catch (error) {
      console.error("Error updating workspace:", error);
      alert("Failed to update workspace.");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!project) return;

    const updatedWorkspaces = project.workspaces.filter(
      (ws) => ws !== decodeURIComponent(workspaceId)
    );

    try {
      if (updatedWorkspaces.length === 0) {
        await deleteDoc(doc(db, "projects", project.id));
      } else {
        await updateDoc(doc(db, "projects", project.id), {
          workspaces: updatedWorkspaces,
        });
      }
      navigate(`/${userId}/dashboard`);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace.");
    }
  };

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
    // Placeholder: Add navigation or state changes for different features
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0C1E3C]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-500">{error}</h2>
          <button
            onClick={() => navigate(`/${userId}/dashboard`)}
            className="mt-4 px-4 py-2 bg-purple-500 rounded-md text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0C1E3C]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex text-white bg-[#0C1E3C]">
      {/* Sidebar */}
      <div className="w-64 bg-[#15294D] p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-6">
          Workik<span className="text-purple-400">.</span>
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
          <div
            onClick={() => handleFeatureSelect("Learning with AI")}
            className={`px-4 py-2 rounded-md cursor-pointer ${
              selectedFeature === "Learning with AI"
                ? "bg-[#1F3A6B] text-purple-300 font-semibold"
                : "hover:bg-[#1F3A6B]"
            }`}
          >
            Learning with AI
          </div>
          <div
            onClick={() => handleFeatureSelect("AI Bots")}
            className={`px-4 py-2 rounded-md cursor-pointer ${
              selectedFeature === "AI Bots"
                ? "bg-[#1F3A6B] text-purple-300 font-semibold"
                : "hover:bg-[#1F3A6B]"
            }`}
          >
            AI Bots
          </div>
          <div
            onClick={() => handleFeatureSelect("Database Tools")}
            className={`px-4 py-2 rounded-md cursor-pointer ${
              selectedFeature === "Database Tools"
                ? "bg-[#1F3A6B] text-purple-300 font-semibold"
                : "hover:bg-[#1F3A6B]"
            }`}
          >
            Database Tools
          </div>
          <div
            onClick={() => handleFeatureSelect("Application Generator")}
            className={`px-4 py-2 rounded-md cursor-pointer ${
              selectedFeature === "Application Generator"
                ? "bg-[#1F3A6B] text-purple-300 font-semibold"
                : "hover:bg-[#1F3A6B]"
            }`}
          >
            Application Generator <span className="text-xs">β</span>
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
          <div
            onClick={() => handleFeatureSelect("AI DB Documentation")}
            className={`px-4 py-2 rounded-md cursor-pointer ${
              selectedFeature === "AI DB Documentation"
                ? "bg-[#1F3A6B] text-purple-300 font-semibold"
                : "hover:bg-[#1F3A6B]"
            }`}
          >
            AI DB Documentation
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

        <div className="mt-auto pt-6 border-t border-[#1F3A6B]">
          <button className="w-full px-4 py-2 bg-[#1F3A6B] text-white rounded-md hover:bg-[#264C8C]">
            VS Code Extension
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#15294D] px-6 py-4 flex justify-between items-center border-b border-[#1F3A6B]">
          <h2 className="text-lg font-semibold">{project.projectName} - {decodeURIComponent(workspaceId)}</h2>
          <div className="flex items-center gap-3">
            <select className="bg-[#1F3A6B] text-white px-2 py-1 rounded-md text-sm">
              <option>{userId}</option>
            </select>
            <button className="px-3 py-1 bg-green-600 rounded-md text-sm">Team</button>
            <button
              onClick={() => {
                setNewWorkspaceName(decodeURIComponent(workspaceId));
                setShowEditModal(true);
              }}
              className="px-3 py-1 bg-[#1F3A6B] rounded-md text-sm"
            >
              Edit Workspace
            </button>
            <button
              onClick={handleDeleteWorkspace}
              className="px-3 py-1 bg-red-600 rounded-md text-sm"
            >
              Delete Workspace
            </button>
            <button className="px-3 py-1 bg-purple-500 rounded-md text-sm">Create Workspace</button>
          </div>
        </div>

        {/* Tabs and Context */}
        <div className="flex flex-1">
          {/* Left Panel */}
          <div className="flex-1 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-purple-400 border-b border-purple-400 pb-1">default</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#1F3A6B] rounded-md text-sm">+ Tab</button>
                <button className="px-3 py-1 bg-[#1F3A6B] rounded-md text-sm">Tab list</button>
                <button className="px-3 py-1 bg-[#1F3A6B] rounded-md text-sm">Settings</button>
              </div>
            </div>
            <motion.div
              className="bg-[#0C1E3C] p-10 rounded-xl border border-[#1F3A6B] h-[calc(100%-48px)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-center text-lg mb-4">Ready to supercharge your development?</h3>
              <p className="text-center text-gray-400 mb-8">
                Input your requirements in the text box below 👇 to generate context driven output
              </p>
              <input
                type="text"
                placeholder="Enter your requirements here..."
                className="w-full px-4 py-2 rounded-md bg-[#1F3A6B] text-white focus:outline-none"
              />
            </motion.div>
          </div>

          {/* Right Panel */}
          <div className="w-1/4 p-8 border-l border-[#1F3A6B]">
            <h4 className="text-white mb-4 text-lg font-semibold">Workspace Context</h4>
            <div className="bg-[#1F3A6B] p-6 rounded-lg text-center">
              <p className="text-gray-300 mb-4">No context added yet</p>
              <button className="px-4 py-2 bg-purple-500 rounded-md text-white">+ Add context</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Workspace Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F2A44] p-6 rounded-md shadow-lg z-50 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Edit Workspace</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter new workspace name"
                  />
                </div>
                <button
                  onClick={handleEditWorkspace}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 text-white font-medium rounded-md transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}