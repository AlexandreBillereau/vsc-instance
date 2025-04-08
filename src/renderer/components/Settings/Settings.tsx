import React, { useEffect, useState } from 'react';
import './Settings.css';
import { EditorInstance } from '../../../main/features/editor-instances/types';
import { CONST_IPC_CHANNELS } from '../../../main/features/shared/constants/names';

export function Settings() {
  const [templateInstance, setTemplateInstance] = useState<EditorInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createTemplateInstance = async () => {
    setError(null);
    const result = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.CREATE_EDITOR_INSTANCE_TEMPLATE);
    if (result.success) {
      setTemplateInstance(result.data);
    } else {
      setError(result.message || 'Failed to create template instance');
    }
  }

  const openTemplateInstance = async () => {
    setError(null);
    try {
      await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.OPEN_EDITOR_INSTANCE, templateInstance?.id);
    } catch (err) {
      setError('Failed to open template instance');
    }
  }

  useEffect(() => {
    const fetchTemplateInstance = async () => {
      const instance = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.GET_TEMPLATE_INSTANCE);
      setTemplateInstance(instance);
    }
    fetchTemplateInstance();
  }, []);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your Core Template and other settings</p>
      </div>

      <div className="template-card">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Core Template
        </h3>

        <div className="feature-list">
          <div className="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="feature-item-content">
              <h4>Centralized Configuration</h4>
              <p>Manage your VS Code extensions and settings in a single template instance that will serve as the foundation for all other instances.</p>
            </div>
          </div>

          <div className="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="feature-item-content">
              <h4>Automatic Synchronization</h4>
              <p>New instances automatically inherit extensions and settings from the Core Template.</p>
            </div>
          </div>

          <div className="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <div className="feature-item-content">
              <h4>Flexible Customization</h4>
              <p>Each instance can be customized individually while maintaining base configurations.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="template-actions">
          {templateInstance ? (
            <>
              <button onClick={openTemplateInstance}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Open Template
              </button>
              <div className="template-status active">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Template Active
              </div>
            </>
          ) : (
            <button onClick={createTemplateInstance}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}