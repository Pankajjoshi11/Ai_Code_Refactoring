import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import LeftSidebar from "./LeftSidebar";

export default function Workspaces() {
  const navigate = useNavigate();
  const { userId, projectId, workspaceId } = useParams();
  const [project, setProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [error, setError] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState("Programming with AI");
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showWorkspaceOptionsModal, setShowWorkspaceOptionsModal] = useState(false);
  const [newWorkspaces, setNewWorkspaces] = useState([""]);
  const [newWorkspaceData, setNewWorkspaceData] = useState(null);
  const [refactoringOption, setRefactoringOption] = useState("Full");

  // Fetch the project using projectId
  useEffect(() => {
    if (!userId || !projectId) return;

    const unsubscribe = onSnapshot(
      doc(db, "projects", projectId),
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          setError("Project not found.");
          return;
        }
        const projectData = { id: docSnapshot.id, ...docSnapshot.data() };
        setProject(projectData);

        // Verify workspaceId exists in the project
        const decodedWorkspaceId = decodeURIComponent(workspaceId);
        if (!projectData.workspaces.includes(decodedWorkspaceId)) {
          setError("Workspace not found in this project.");
        }
      },
      (err) => {
        console.error("Error fetching project:", err);
        setError("Failed to load project.");
      }
    );

    return () => unsubscribe();
  }, [userId, projectId, workspaceId]);

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
      navigate(`/${userId}/project/${projectId}/workspace/${encodeURIComponent(newWorkspaceName)}`);
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
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (newWorkspaces.some(workspace => !workspace.trim())) {
      alert("Please fill in all workspace fields.");
      return;
    }

    const workspaceData = {
      newWorkspaces: newWorkspaces.filter(workspace => workspace.trim()),
    };

    setNewWorkspaceData(workspaceData);
    setShowCreateWorkspaceModal(false);
    setShowWorkspaceOptionsModal(true);
  };

  const handleWorkspaceOption = async (option) => {
    if (!newWorkspaceData || !project) return;

    try {
      const updatedWorkspaces = [
        ...project.workspaces,
        ...newWorkspaceData.newWorkspaces,
      ];
      await updateDoc(doc(db, "projects", project.id), {
        workspaces: updatedWorkspaces,
      });

      if (option === "open" && newWorkspaceData.newWorkspaces.length > 0) {
        const newWorkspaceId = encodeURIComponent(newWorkspaceData.newWorkspaces[0]);
        navigate(`/${userId}/project/${projectId}/workspace/${newWorkspaceId}`);
      } else {
        setShowWorkspaceOptionsModal(false);
      }
      setNewWorkspaces([""]);
      setNewWorkspaceData(null);
    } catch (error) {
      console.error("Error adding workspace to project:", error);
      alert("Failed to create workspace.");
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
      <LeftSidebar
        selectedFeature={selectedFeature}
        handleFeatureSelect={handleFeatureSelect}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <div className="bg-[#15294D] px-6 py-4 flex items-center border-b border-[#1F3A6B]">
          <h2 className="text-lg font-semibold flex-1">
            {project.projectName} - {decodeURIComponent(workspaceId)}
          </h2>
          <div className="flex-1 text-center">
            <span className="text-lg font-semibold text-purple-300">{selectedFeature}</span>
          </div>
          <div className="flex-1"></div>
        </div>

        {/* Action Buttons */}
        <div className="bg-[#0C1E3C] px-6 py-3 flex justify-end items-center border-b border-[#1F3A6B]">
          <div className="flex items-center gap-3">
            <select
              value={decodeURIComponent(workspaceId)}
              onChange={(e) => {
                const selectedWorkspace = encodeURIComponent(e.target.value);
                navigate(`/${userId}/project/${projectId}/workspace/${selectedWorkspace}`);
              }}
              className="bg-[#1F3A6B] text-white px-2 py-1 rounded-md text-sm"
            >
              {project.workspaces.map((workspace) => (
                <option key={workspace} value={workspace}>
                  {workspace}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setNewWorkspaceName(decodeURIComponent(workspaceId));
                setShowEditModal(true);
              }}
              className="px-3 py-1 bg-[#1F3A6B] rounded-md text-sm hover:bg-[#264C8C]"
            >
              Edit Workspace
            </button>
            <button
              onClick={handleDeleteWorkspace}
              className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
            >
              Delete Workspace
            </button>
            <button
              onClick={() => setShowCreateWorkspaceModal(true)}
              className="px-3 py-1 bg-purple-500 rounded-md text-sm hover:bg-purple-600"
            >
              Create Workspace
            </button>
          </div>
        </div>

        {/* Tabs and Context */}
        <div className="flex flex-1">
          {/* Left Panel */}
          <div className="flex-1 p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm text-white">
                Select Refactoring Option
              </div>
              <select
                value={refactoringOption}
                onChange={(e) => setRefactoringOption(e.target.value)}
                className="bg-[#1F3A6B] text-white px-2 py-1 rounded-md text-sm"
              >
                <option value="Full">Full</option>
                <option value="Safe-mode">Safe-mode</option>
                <option value="Modern mode">Modern mode</option>
              </select>
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
                className="w-full px-4 py-2 rounded-md bg-[#1F3A6B] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </motion.div>
          </div>

          {/* Right Panel */}
          <div className="w-1/4 p-8 border-l border-[#1F3A6B]">
            <h4 className="text-white mb-4 text-lg font-semibold">Workspace Context</h4>
            <div className="bg-[#1F3A6B] p-6 rounded-lg text-center">
              <p className="text-gray-300 mb-4">No context added yet</p>
              <button className="px-4 py-2 bg-purple-500 rounded-md text-white hover:bg-purple-600">
                + Add context
              </button>
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

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateWorkspaceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowCreateWorkspaceModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1F2A44] p-6 rounded-md shadow-lg z-50 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create New Workspace</h3>
              <div className="space-y-4">
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
                  onClick={handleCreateWorkspace}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 text-white font-medium rounded-md transition-all"
                >
                  Create Workspace
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