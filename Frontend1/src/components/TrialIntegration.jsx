import { useState, useEffect } from 'react';
import axios from 'axios';

function TrialIntegration() {
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

  // Check if authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:9000/repos', {
          withCredentials: true,
        });
        console.log('Auth check response:', response.data);
        setAccessToken(true);
        setRepos(response.data);
        setShowRepoSelection(true);
      } catch (error) {
        console.error('Auth check error:', error.response ? error.response.data : error.message);
        setError(error.response ? error.response.data.error : 'Failed to authenticate');
        setAccessToken(false);
      }
    };
    checkAuth();
  }, []);

  // Save selected repositories
  const saveSelectedRepos = async () => {
    try {
      await axios.post('http://localhost:9000/repos/select', {
        selectedRepos: selectedRepos.map(repo => repo.id),
      }, { withCredentials: true });
      console.log('Selected repos saved:', selectedRepos);
      setShowRepoSelection(false);
      setError(null);
    } catch (error) {
      console.error('Error saving selected repos:', error.response ? error.response.data : error.message);
      setError('Failed to save repository selection');
    }
  };

  // Fetch branches when a repo is selected
  useEffect(() => {
    if (selectedRepo) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:9000/repos/${owner}/${repo}/branches`, { withCredentials: true })
        .then(response => {
          console.log('Branches fetched:', response.data);
          setBranches(response.data);
        })
        .catch(error => {
          console.error('Error fetching branches:', error.response ? error.response.data : error.message);
          setError('Failed to fetch branches');
        });
    }
  }, [selectedRepo]);

  // Fetch files when a branch is selected
  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:9000/repos/${owner}/${repo}/contents/`, {
        params: { branch: selectedBranch },
        withCredentials: true,
      })
        .then(response => {
          const files = response.data.filter(item => item.type === 'file');
          console.log('Files fetched:', files);
          setFiles(files);
        })
        .catch(error => {
          console.error('Error fetching files:', error.response ? error.response.data : error.message);
          setError('Failed to fetch files');
        });
    }
  }, [selectedRepo, selectedBranch]);

  // Fetch file content
  useEffect(() => {
    if (selectedRepo && selectedBranch && selectedFile) {
      const [owner, repo] = selectedRepo.split('/');
      axios.get(`http://localhost:9000/repos/${owner}/${repo}/contents/${selectedFile}`, {
        params: { branch: selectedBranch },
        withCredentials: true,
      })
        .then(response => {
          console.log('File content fetched:', response.data);
          setCode(response.data.content);
        })
        .catch(error => {
          console.error('Error fetching file content:', error.response ? error.response.data : error.message);
          setError('Failed to fetch file content');
        });
    }
  }, [selectedRepo, selectedBranch, selectedFile]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:9000/auth/github';
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
      const response = await axios.post('http://localhost:9000/refactor', { code }, {
        withCredentials: true,
      });
      console.log('Refactored code:', response.data);
      setRefactoredCode(response.data.refactoredCode);
      setError(null);
    } catch (error) {
      console.error('Error refactoring code:', error.response ? error.response.data : error.message);
      setError('Error refactoring code');
    }
  };

  const handlePush = async () => {
    const [owner, repo] = selectedRepo.split('/');
    try {
      await axios.post(`http://localhost:9000/repos/${owner}/${repo}/contents/${selectedFile}`, {
        content: refactoredCode,
        branch: selectedBranch,
        message: 'Refactored code by AI',
      }, { withCredentials: true });
      console.log('Code pushed successfully');
      alert('Code pushed successfully!');
      setError(null);
    } catch (error) {
      console.error('Error pushing code:', error.response ? error.response.data : error.message);
      setError('Error pushing code');
    }
  };

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={handleLogin}>Retry GitHub Login</button>
      </div>
    );
  }

  if (!accessToken) {
    return <button onClick={handleLogin}>Connect with GitHub</button>;
  }

  if (showRepoSelection) {
    return (
      <div>
        <h3>Select Repositories to Access</h3>
        <ul>
          {repos.map(repo => (
            <li key={repo.id}>
              <input
                type="checkbox"
                checked={selectedRepos.includes(repo)}
                onChange={() => handleRepoToggle(repo)}
              />
              {repo.name} ({repo.owner.login})
            </li>
          ))}
        </ul>
        <button onClick={saveSelectedRepos} disabled={selectedRepos.length === 0}>
          Confirm Selection
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="repo-section">
        <label>Select Repository:</label>
        <select onChange={e => setSelectedRepo(e.target.value)} value={selectedRepo}>
          <option value="">Select a repository</option>
          {repos.map(repo => (
            <option key={repo.id} value={`${repo.owner.login}/${repo.name}`}>
              {repo.name}
            </option>
          ))}
        </select>
      </div>
      {selectedRepo && (
        <div>
          <label>Select Branch:</label>
          <select onChange={e => setSelectedBranch(e.target.value)} value={selectedBranch}>
            <option value="">Select a branch</option>
            {branches.map(branch => (
              <option key={branch.name} value={branch.name}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}
      {selectedBranch && (
        <div>
          <label>Select File:</label>
          <select onChange={e => setSelectedFile(e.target.value)} value={selectedFile}>
            <option value="">Select a file</option>
            {files.map(file => (
              <option key={file.path} value={file.path}>{file.path}</option>
            ))}
          </select>
        </div>
      )}
      {code && (
        <div>
          <h3>Original Code</h3>
          <textarea value={code} readOnly rows={10} cols={50} />
          <button onClick={handleRefactor}>Refactor Code</button>
        </div>
      )}
      {refactoredCode && (
        <div>
          <h3>Refactored Code</h3>
          <textarea value={refactoredCode} onChange={e => setRefactoredCode(e.target.value)} rows={10} cols={50} />
          <button onClick={handlePush}>Push to GitHub</button>
        </div>
      )}
    </div>
  );
}

export default TrialIntegration;