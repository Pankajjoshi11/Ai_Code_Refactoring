import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TrialIntegration() {
  const [accessToken, setAccessToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [code, setCode] = useState('');
  const [refactoredCode, setRefactoredCode] = useState('');
  const [showRepoSelection, setShowRepoSelection] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/repos', { withCredentials: true });
        setAccessToken(true);
        setRepos(response.data);
        setShowRepoSelection(true);
      } catch (error) {
        setError(error.response ? error.response.data.error : 'Failed to authenticate');
        setAccessToken(false);
      }
    };
    checkAuth();
  }, []);

  const saveSelectedRepos = async () => {
    try {
      await axios.post('http://localhost:5000/repos/select', {
        selectedRepos: selectedRepos.map(repo => repo.id),
      }, { withCredentials: true });
      setShowRepoSelection(false);
      setError(null);
    } catch (error) {
      setError('Failed to save repository selection');
    }
  };

  useEffect(() => {
    if (selectedRepo) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:5000/repos/${owner}/${repo}/branches`, { withCredentials: true })
        .then(res => setBranches(res.data))
        .catch(() => setError('Failed to fetch branches'));
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:5000/repos/${owner}/${repo}/contents/`, {
        params: { branch: selectedBranch },
        withCredentials: true,
      })
        .then(res => setFiles(res.data.filter(item => item.type === 'file')))
        .catch(() => setError('Failed to fetch files'));
    }
  }, [selectedRepo, selectedBranch]);

  useEffect(() => {
    if (selectedRepo && selectedBranch && selectedFile) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:5000/repos/${owner}/${repo}/contents/${selectedFile}`, {
        params: { branch: selectedBranch },
        withCredentials: true,
      })
        .then(res => setCode(res.data.content))
        .catch(() => setError('Failed to fetch file content'));
    }
  }, [selectedRepo, selectedBranch, selectedFile]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/github';
  };

  const handleRepoToggle = (repo) => {
    setSelectedRepos(prev =>
      prev.includes(repo)
        ? prev.filter(r => r.id !== repo.id)
        : [...prev, repo]
    );
  };

  const handleRefactor = async () => {
    try {
      const response = await axios.post('http://localhost:5000/refactor', { code }, { withCredentials: true });
      setRefactoredCode(response.data.refactoredCode);
      setError(null);
    } catch {
      setError('Error refactoring code');
    }
  };

  const handlePush = async () => {
    const [owner, repo] = selectedRepo.split('/');
    try {
      await axios.post(`http://localhost:5000/repos/${owner}/${repo}/contents/${selectedFile}`, {
        content: refactoredCode,
        branch: selectedBranch,
        message: 'Refactored code by AI',
      }, { withCredentials: true });
      alert('Code pushed successfully!');
      setError(null);
    } catch {
      setError('Error pushing code');
    }
  };

  return (
    <div className="p-6 bg-[#0F172A] text-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 .1.7-1.6.7-1.6-.8-1.5-2.6-1.4-3.3-1.4-.1-.9-.2-1.8.4-2.5.6-.6 1.6-.2 2.4.5.7-.2 1.5-.3 2.3-.3.8 0 1.6.1 2.3.3.8-.7 1.8-1 2.4-.5.6.7.5 1.6.4 2.5-.8 0-2.5-.1-3.3 1.4 0 0-.3 1.7.7 1.6 0 0 .5-1 1.6-1.1 0 0 1.1 0 .1.7 0 0-.8.3-1.2 1.6 0 0-.7 2.3-4 1.6v2.2c0 .3.2.6.8.6A12 12 0 0 0 12 .5z" />
        </svg>
        Github Integration
      </h2>

      {!accessToken && (
        <button onClick={handleLogin} className="px-4 py-2 bg-purple-500 rounded-md hover:bg-purple-600">
          Connect with GitHub
        </button>
      )}

      {error && (
        <div className="text-red-500 my-4">
          <p>Error: {error}</p>
          <button onClick={handleLogin} className="underline">Retry GitHub Login</button>
        </div>
      )}

      {accessToken && (
        <div className="bg-[#1E293B] p-6 rounded-lg mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center">{repos.length > 0 ? repos[0].owner.login.charAt(0).toUpperCase() : '?'}</div>
              <span className="font-medium">{repos.length > 0 ? repos[0].owner.login : 'Unknown'}</span>
            </div>
            <button onClick={() => setAccessToken(false)} className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md">Disconnect</button>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Accessible repositories</label>
            <select
              className="w-full p-2 bg-[#334155] text-white rounded-md"
              onChange={e => setSelectedRepo(e.target.value)}
              value={selectedRepo}
            >
              <option value="">Select a repository</option>
              {repos.map(repo => (
                <option key={repo.id} value={`${repo.owner.login}/${repo.name}`}>{repo.name}</option>
              ))}
            </select>
          </div>

          {selectedRepo && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Branch</label>
              <select
                className="w-full p-2 bg-[#334155] text-white rounded-md"
                onChange={e => setSelectedBranch(e.target.value)}
                value={selectedBranch}
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedBranch && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">File</label>
              <select
                className="w-full p-2 bg-[#334155] text-white rounded-md"
                onChange={e => setSelectedFile(e.target.value)}
                value={selectedFile}
              >
                <option value="">Select a file</option>
                {files.map(file => (
                  <option key={file.path} value={file.path}>{file.path}</option>
                ))}
              </select>
            </div>
          )}

          {code && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Original Code</h3>
              <textarea className="w-full p-2 bg-[#1F3A6B] text-white rounded-md" rows={10} readOnly value={code} />
              <button onClick={handleRefactor} className="mt-2 px-4 py-2 bg-purple-500 rounded-md hover:bg-purple-600">
                Refactor Code
              </button>
            </div>
          )}

          {refactoredCode && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Refactored Code</h3>
              <textarea
                className="w-full p-2 bg-[#1F3A6B] text-white rounded-md"
                rows={10}
                value={refactoredCode}
                onChange={e => setRefactoredCode(e.target.value)}
              />
              <button onClick={handlePush} className="mt-2 px-4 py-2 bg-purple-500 rounded-md hover:bg-purple-600">
                Push to GitHub
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}