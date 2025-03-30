import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Instance.css';
import { loadInstances, instances } from '../../App';
import { EditorInstance, IPCResult } from '../../../main/features/editor-instances/types';
import { CONST_IPC_CHANNELS } from '../../../main/features/shared/constants/names';
import { ColorPicker } from './ColorPicker';

interface ExtensionMetadata {
  installedTimestamp: number;
  pinned: boolean;
  source: string;
  publisherDisplayName: string;
  targetPlatform: string;
  isPreReleaseVersion: boolean;
}

interface Extension {
  identifier: {
    id: string;
    uuid?: string;
  };
  version: string;
  name?: string;
  publisher?: string;
  displayName?: string;
  description?: string;
  metadata: ExtensionMetadata;
  relativeLocation: string;
  icon?: string;
}

export function Instance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const instance: EditorInstance | undefined = instances.value.find(instance => instance.id === id);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  const loadExtensions = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.GET_INSTANCE_EXTENSIONS, id);
      setExtensions(result);
      console.log(result);
    } catch (err) {
      setError('Failed to load extensions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtensions();
  }, [id]);

  const handleOpen = async () => {
    await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.OPEN_EDITOR_INSTANCE, id);
  };

  const handleDelete = async () => {
    const result: IPCResult = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.DELETE_EDITOR_INSTANCE, id);
    
    if (result.success) {
      loadInstances();
      navigate('/');
    } else {
      setError(result.message || 'An error occurred while deleting the instance');
    }
  };

  const handleOpenFolder = async (path: string) => {
    await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.OPEN_FOLDER, path);
  };

  const handleSyncExtensions = async () => {
    try {
      setIsSyncing(true);
      await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.SYNC_EXTENSIONS, id);
      await loadExtensions();
    } catch (error) {
      console.error('Failed to sync extensions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportInstance = async () => {
    await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.EXPORT_INSTANCE, id);
  };

  const handleColorSelect = async (color: string) => {
    if (!instance) return;
    
    try {
      await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.UPDATE_INSTANCE_COLOR, instance.id, color);
      loadInstances();
      setShowColorPicker(false);
    } catch (error) {
      console.error('Failed to update instance color:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading extensions...</div>;
  }
  console.log("instance : ", instance);
  return (
    <div className="instance-container">
      <div className="instance-header">
        <div className="instance-header-top">
          <div className="instance-icon" dangerouslySetInnerHTML={{ __html: instance?.icon?.svg || '' }} />
          <h2>{instance?.name}</h2>
        </div>
      </div>

      <div className="instance-content">
        <div className="instance-details">
          <div className="instance-details-group">
            <div className="instance-details-item">
              <span className="instance-details-label">Editor Type:</span>
              <span className="instance-details-value">{instance?.type === 'vscode' ? 'Visual Studio Code' : 'Cursor'}</span>
            </div>
            <div className="instance-details-item">
              <span className="instance-details-label">Instance ID:</span>
              <span className="instance-details-value" title="Unique identifier for this editor instance">{instance?.id}</span>
            </div>
            <div className="instance-details-item">
              <span className="instance-details-label">Created:</span>
              <span className="instance-details-value">{new Date(instance?.createdAt || '').toLocaleDateString()}</span>
            </div>
            <div className="instance-details-item">
              <span className="instance-details-label">Theme Color:</span>
              <button
                className="color-preview-button"
                onClick={() => setShowColorPicker(true)}
                style={{
                  backgroundColor: instance?.color || 'transparent',
                  border: instance?.color ? 'none' : '1px dashed var(--color-border)'
                }}
              >
                {!instance?.color && 'Choose Color'}
              </button>
            </div>
          </div>
          <div className="instance-folders">
            <div className="instance-details-item folder-item">
              <div className="folder-path">
                <span className="instance-details-label">Instance Location:</span>
                <p className="instance-details-description">
                  This is where all instance-specific data is stored, including settings, extensions, and workspace configuration.
                </p>
                <span className="instance-details-value" title={instance?.instanceDir}>
                  {instance?.instanceDir}
                </span>
              </div>
              <div className="folder-actions">
                <button 
                  onClick={() => handleOpenFolder(instance?.instanceDir || '')}
                  className="action-button"
                  title="Open instance folder in file explorer"
                >
                  <div className="button-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    Open Folder
                  </div>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(instance?.instanceDir || '');
                    const button = document.activeElement as HTMLButtonElement;
                    const originalText = button.querySelector('.button-text')?.textContent;
                    if (button && originalText) {
                      const textElement = button.querySelector('.button-text');
                      if (textElement) {
                        textElement.textContent = 'Copied!';
                        setTimeout(() => {
                          textElement.textContent = originalText;
                        }, 2000);
                      }
                    }
                  }}
                  className="action-button"
                  title="Copy folder path to clipboard"
                >
                  <div className="button-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span className="button-text">Copy Path</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="instance-actions">
          <button onClick={handleOpen} className="action-button open-button">
            <div className="button-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Launch Editor
            </div>
            <div className="active-indicator"></div>
          </button>

          <button onClick={handleExportInstance} className="action-button export-button">
            <div className="button-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Instance
            </div>
            <div className="active-indicator"></div>
          </button>
          
          <button onClick={handleDelete} className="action-button delete-button">
            <div className="button-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Instance
            </div>
            <div className="active-indicator"></div>
          </button>
        </div>

        {error && (
          <div className="action-message warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="extensions-list">
          <div className="extensions-list-header">
            <h2>
              Extensions
              <span className="extension-count" title="Number of installed extensions">{extensions.length}</span>
            </h2>
            <button 
              onClick={() => setShowSyncConfirm(true)}
              className={`sync-extensions-button ${isSyncing ? 'is-syncing' : ''}`}
              disabled={isSyncing}
              title="Synchronize extensions with Core Template"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M426.1 301.2C406.2 376.5 337.6 432 256 432c-51 0-96.9-21.7-129-56.3l41-41c5.1-5.1 8-12.1 8-19.3c0-15.1-12.2-27.3-27.3-27.3L48 288c-8.8 0-16 7.2-16 16l0 100.7C32 419.8 44.2 432 59.3 432c7.2 0 14.2-2.9 19.3-8l25.7-25.7C142.3 438.7 196.2 464 256 464c97.4 0 179.2-67 201.8-157.4c2.4-9.7-5.2-18.6-15.2-18.6c-7.8 0-14.5 5.6-16.5 13.2zM385 136.3l-41 41c-5.1 5.1-8 12.1-8 19.3c0 15.1 12.2 27.3 27.3 27.3L464 224c8.8 0 16-7.2 16-16l0-100.7C480 92.2 467.8 80 452.7 80c-7.2 0-14.2 2.9-19.3 8l-25.7 25.7C369.7 73.3 315.8 48 256 48C158.6 48 76.8 115 54.2 205.4c-2.4 9.7 5.2 18.6 15.2 18.6c7.8 0 14.5-5.6 16.5-13.2C105.8 135.5 174.4 80 256 80c51 0 96.9 21.7 129.1 56.3zM448 192l-73.4 0L448 118.6l0 73.4zM64 320l73.4 0L64 393.4 64 320z"/>
              </svg>
              Sync with Core Template
            </button>
          </div>
          <p className="extensions-description">
            Extensions installed in this instance. Core Template extensions are shared across instances, while instance-specific extensions are stored locally.
          </p>
          {extensions.map((extension) => (
            <div key={extension.identifier.id} className="extension-item">
              <div className="extension-header">
                <div className="extension-title">
                  {extension.icon ? (
                    <img 
                      src={extension.icon} 
                      alt="" 
                      className="extension-icon"
                    />
                  ) : (
                    <div className="extension-icon-placeholder">
                      {(extension.displayName || extension.name || '').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3>{extension.displayName || extension.name || extension.identifier.id.split('.').pop()}</h3>
                </div>
                <span className="extension-version">{extension.version}</span>
              </div>
              <div className="extension-publisher">
                {extension.metadata.publisherDisplayName || extension.publisher}
                {extension.metadata.isPreReleaseVersion && (
                  <span className="extension-badge pre-release">Pre-release</span>
                )}
              </div>
              {extension.description && (
                <div className="extension-description">{extension.description}</div>
              )}
              <div className="extension-meta">
                <span className="extension-id">{extension.identifier.id}</span>
                <span className="extension-install-date">
                  {new Date(extension.metadata.installedTimestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showColorPicker && (
        <ColorPicker
          onSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {showSyncConfirm && (
        <div className="modal-overlay" onClick={() => setShowSyncConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Sync Extensions</h3>
            <p>
              This will synchronize extensions with the Core Template. Any instance-specific extensions will be preserved.
              Are you sure you want to continue?
            </p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel" 
                onClick={() => setShowSyncConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button confirm" 
                onClick={() => {
                  setShowSyncConfirm(false);
                  handleSyncExtensions();
                }}
              >
                Sync Extensions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 