import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const RefactoringGround = ({
  project,
  workspaceId,
  userId,
  projectId,
  refactoringOption,
  setRefactoringOption,
  setShowEditModal,
  setNewWorkspaceName,
  handleDeleteWorkspace,
  setShowCreateWorkspaceModal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col">
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

      {/* Chat Section and Refactoring Option */}
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
    </div>
  );
};

export default RefactoringGround;