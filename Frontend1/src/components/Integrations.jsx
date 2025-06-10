import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import LeftSidebar from './LeftSidebar';
import HeaderDashboard from './HeaderDashboard';
import toast, { Toaster } from 'react-hot-toast';

const Integrations = ({ selectedFeature, handleFeatureSelect, user, handleLogout, toggleDropdown, showDropdown, dropdownRef }) => {
  const navigate = useNavigate();
  const { userId, projectId, workspaceId } = useParams();
  const [project, setProject] = useState(null);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Fetch project data
  useEffect(() => {
    if (!userId || !projectId) return;

    const unsubscribe = onSnapshot(
      doc(db, "projects", projectId),
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          console.error("Project not found.");
          return;
        }
        const projectData = { id: docSnapshot.id, ...docSnapshot.data() };
        setProject(projectData);
      },
      (err) => {
        console.error("Error fetching project:", err);
      }
    );

    return () => unsubscribe();
  }, [userId, projectId]);

  // Check if GitHub is connected by looking for the github_token in Firestore
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().github_token) {
          setIsGithubConnected(true);
          toast.success("GitHub connected successfully!", {
            position: "top-right",
            duration: 3000,
          });

          // Fetch repositories after connection
          fetchRepositories();
        } else {
          setIsGithubConnected(false);
          setRepos([]);
          setBranches([]);
          setSelectedRepo(null);
          setSelectedBranch(null);
        }
      },
      (err) => {
        console.error("Error checking GitHub connection:", err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch repositories using the backend endpoint
  const fetchRepositories = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/github/repos/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const data = await response.json();
      setRepos(data);
      if (data.length > 0) {
        setSelectedRepo(data[0]); // Default to the first repository
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast.error("Failed to fetch repositories.");
    }
  };

  // Fetch branches when a repository is selected
  useEffect(() => {
    if (!selectedRepo) return;

    const fetchBranches = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `http://localhost:5000/github/branches/${userId}/${selectedRepo.owner.login}/${selectedRepo.name}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch branches");
        }
        const data = await response.json();
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0].name); // Default to the first branch
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch branches.");
      }
    };

    fetchBranches();
  }, [selectedRepo, userId, user]);

  // Handle repository selection
  const handleRepoChange = (e) => {
    const repoId = parseInt(e.target.value);
    const repo = repos.find((r) => r.id === repoId);
    setSelectedRepo(repo);
    setBranches([]); // Reset branches until new ones are fetched
    setSelectedBranch(null);
  };

  // Handle branch selection
  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  // Save the selected repository and branch to the project
  const handleSaveContext = async () => {
    if (!selectedRepo || !selectedBranch) {
      toast.error("Please select a repository and branch.");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:5000/github/save-context/${userId}/${projectId}/${workspaceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            repo: selectedRepo.full_name,
            branch: selectedBranch,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save context");
      }
      toast.success("GitHub context saved successfully!", {
        position: "top-right",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving context:", error);
      toast.error("Failed to save GitHub context.");
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await updateDoc(doc(db, "users", userId), {
        github_token: null,
      });
      setIsGithubConnected(false);
      setRepos([]);
      setBranches([]);
      setSelectedRepo(null);
      setSelectedBranch(null);
      toast.success("GitHub disconnected successfully!", {
        position: "top-right",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      toast.error("Failed to disconnect GitHub.");
    }
  };

  const handleConnectGithub = () => {
    // Encode projectId and workspaceId in the state parameter
    const state = JSON.stringify({ projectId, workspaceId });
    const githubAuthUrl = `http://localhost:5000/auth/github?state=${encodeURIComponent(state)}`;
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="min-h-screen flex text-white bg-[#0C1E3C]">
      {/* Toast Notification */}
      <Toaster />

      {/* Sidebar */}
      <LeftSidebar
        selectedFeature={selectedFeature}
        handleFeatureSelect={handleFeatureSelect}
        userId={userId}
        projectId={projectId}
        workspaceId={workspaceId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <HeaderDashboard
          projectName={project?.projectName || "Loading..."}
          workspaceId={workspaceId}
          selectedFeature={selectedFeature}
          user={user}
          handleLogout={handleLogout}
          toggleDropdown={toggleDropdown}
          showDropdown={showDropdown}
          dropdownRef={dropdownRef}
          navigate={navigate}
        />

        {/* Integrations Content */}
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-semibold mb-6">Integrations</h2>
          <div className="bg-[#1F2A44] p-6 rounded-xl border border-[#1F3A6B]">
            {!isGithubConnected ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Connect to GitHub</h3>
                <p className="text-gray-400 mb-6">
                  Integrate your GitHub account to manage repositories and collaborate seamlessly.
                </p>
                <button
                  onClick={handleConnectGithub}
                  className="px-6 py-2 bg-purple-500 rounded-md text-white hover:bg-purple-600"
                >
                  Connect to GitHub
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Connected to GitHub</h3>
                  <button
                    onClick={handleDisconnectGithub}
                    className="px-4 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
                  >
                    Disconnect
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Repository
                    </label>
                    <select
                      value={selectedRepo ? selectedRepo.id : ''}
                      onChange={handleRepoChange}
                      className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {repos.length > 0 ? (
                        repos.map((repo) => (
                          <option key={repo.id} value={repo.id}>
                            {repo.full_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No repositories available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Branch
                    </label>
                    <select
                      value={selectedBranch || ''}
                      onChange={handleBranchChange}
                      disabled={!selectedRepo || branches.length === 0}
                      className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <option key={branch.name} value={branch.name}>
                            {branch.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No branches available</option>
                      )}
                    </select>
                  </div>
                  <button
                    onClick={handleSaveContext}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110 text-white font-medium rounded-md transition-all"
                  >
                    Save GitHub Context
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;