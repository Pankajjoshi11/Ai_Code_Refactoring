import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Integrations = ({ user, selectedFeature, handleFeatureSelect, project, handleLogout, toggleDropdown, showDropdown, dropdownRef }) => {
  const { userId, projectId, workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Check for auth callback results
  useEffect(() => {
    const error = searchParams.get('github_error');
    const success = searchParams.get('github_auth');
    
    if (error) {
      toast.error(`GitHub connection failed: ${error}`);
      navigate(`/${userId}/project/${projectId}/workspace/${workspaceId}/integrations`, { replace: true });
    }
    
    if (success) {
      toast.success('GitHub connected successfully!');
      setIsGithubConnected(true); // Set connected state
      navigate(`/${userId}/project/${projectId}/workspace/${workspaceId}/integrations`, { replace: true });
    }
  }, [searchParams, navigate, userId, projectId, workspaceId]);

  // Fetch repositories
  const fetchRepositories = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/github/repos/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepos(data);
      if (data.length > 0) {
        setSelectedRepo(data[0]); // Default to the first repository
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to fetch repositories.');
    }
  };

  // Fetch branches when a repository is selected
  useEffect(() => {
    if (!selectedRepo || !user) return;

    const fetchBranches = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `${API_BASE_URL}/github/branches/${userId}/${selectedRepo.owner.login}/${selectedRepo.name}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch branches');
        }
        const data = await response.json();
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0].name); // Default to the first branch
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to fetch branches.');
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
      toast.error('Please select a repository and branch.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/github/save-context/${userId}/${projectId}/${workspaceId}`,
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
        throw new Error('Failed to save context');
      }
      toast.success('GitHub context saved successfully!', {
        position: 'top-right',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving context:', error);
      toast.error('Failed to save GitHub context.');
    }
  };

  // Disconnect GitHub
  const handleDisconnectGithub = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        github_token: null,
      });
      setIsGithubConnected(false);
      setRepos([]);
      setBranches([]);
      setSelectedRepo(null);
      setSelectedBranch(null);
      toast.success('GitHub disconnected successfully!', {
        position: 'top-right',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      toast.error('Failed to disconnect GitHub.');
    }
  };

  // Connect GitHub
  const handleConnectGithub = async () => {
    if (!user) {
      toast.error('Please log in to connect to GitHub.');
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      let token;
      try {
        token = await user.getIdToken(true);
      } catch (error) {
        console.error('Failed to retrieve Firebase ID token:', error);
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      if (!token || typeof token !== 'string') {
        console.error('Invalid Firebase ID token:', token);
        throw new Error('Failed to retrieve a valid Firebase ID token');
      }

      const stateData = { projectId, workspaceId, token };
      console.log('State data before sending:', stateData);
      const state = JSON.stringify(stateData);
      const response = await fetch(
        `${API_BASE_URL}/init-github-auth?state=${encodeURIComponent(state)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to initiate GitHub auth:', errorText);
        throw new Error('Failed to initiate GitHub authentication');
      }
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating GitHub auth:', error.message);
      toast.error('Failed to initiate GitHub authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-white bg-[#0C1E3C]">
      <Toaster position="top-right" />
      
      <LeftSidebar
        selectedFeature={selectedFeature}
        handleFeatureSelect={handleFeatureSelect}
        userId={userId}
        projectId={projectId}
        workspaceId={workspaceId}
      />

      <div className="flex-1 flex flex-col">
        <HeaderDashboard
          projectName={project?.projectName || 'Loading...'}
          workspaceId={workspaceId}
          selectedFeature={selectedFeature}
          user={user}
          handleLogout={handleLogout}
          toggleDropdown={toggleDropdown}
          showDropdown={showDropdown}
          dropdownRef={dropdownRef}
        />

        <div className="flex-1 p-8">
          <h2 className="text-2xl font-semibold mb-6">GitHub Integration</h2>
          
          <div className="bg-[#1F2A44] p-6 rounded-xl border border-[#1F3A6B]">
            {!isGithubConnected ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-4">Connect to GitHub</h3>
                <p className="text-gray-400 mb-6">
                  Integrate your GitHub account to access repositories and enable AI-powered refactoring.
                </p>
                <button
                  onClick={handleConnectGithub}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-md text-white flex items-center justify-center mx-auto ${
                    isLoading ? 'bg-purple-600' : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connecting...
                    </>
                  ) : 'Connect to GitHub'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold">Connected to GitHub</h3>
                  </div>
                  <button
                    onClick={handleDisconnectGithub}
                    className="px-4 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Disconnect
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Repository
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRepo?.id || ''}
                        onChange={handleRepoChange}
                        disabled={repos.length === 0}
                        className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {repos.length === 0 ? (
                          <option value="">Loading repositories...</option>
                        ) : (
                          <>
                            <option value="">Select a repository</option>
                            {repos.map((repo) => (
                              <option key={repo.id} value={repo.id}>
                                {repo.full_name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {repos.length > 0 && (
                        <span className="absolute right-3 top-2 text-xs text-gray-400">
                          {repos.length} repos
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Branch
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBranch || ''}
                        onChange={handleBranchChange}
                        disabled={!selectedRepo || branches.length === 0}
                        className="w-full px-3 py-2 bg-[#2A3550] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!selectedRepo ? (
                          <option value="">Select a repository first</option>
                        ) : branches.length === 0 ? (
                          <option value="">Loading branches...</option>
                        ) : (
                          <>
                            <option value="">Select a branch</option>
                            {branches.map((branch) => (
                              <option key={branch.name} value={branch.name}>
                                {branch.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {branches.length > 0 && (
                        <span className="absolute right-3 top-2 text-xs text-gray-400">
                          {branches.length} branches
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveContext}
                    disabled={!selectedRepo || !selectedBranch}
                    className={`w-full px-4 py-2 text-white font-medium rounded-md transition-all flex items-center justify-center ${
                      !selectedRepo || !selectedBranch 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:brightness-110'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save GitHub Context'}
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