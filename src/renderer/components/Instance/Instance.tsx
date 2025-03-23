import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Instance.css';
import { loadInstances } from '../../App';
export function Instance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleOpen = async () => {
    await window.electron.ipcRenderer.invoke('open-editor-instance', id);
  };

  const handleDelete = async () => {
    await window.electron.ipcRenderer.invoke('delete-editor-instance', id);
    loadInstances();
    navigate('/');
  };

  return (
    <div className="instance-container">
      <div className="instance-header">
        <h2>Instance Details</h2>
      </div>
      
      <div className="instance-actions">
        <button onClick={handleOpen} className="action-button open-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Open Instance
        </button>
        
        <button onClick={handleDelete} className="action-button delete-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Instance
        </button>
      </div>
    </div>
  );
} 