import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Instance.css';
import { loadInstances, instances } from '../../App';
import { EditorInstance } from '../../../main/features/editor-instances/types';

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

  useEffect(() => {
    const loadExtensions = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('get-instance-extensions', id);
        setExtensions(result);
        console.log(result);
      } catch (err) {
        setError('Failed to load extensions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadExtensions();
  }, [id]);

  const handleOpen = async () => {
    await window.electron.ipcRenderer.invoke('open-editor-instance', id);
  };

  const handleDelete = async () => {
    await window.electron.ipcRenderer.invoke('delete-editor-instance', id);
    loadInstances();
    navigate('/');
  };

  const handleOpenFolder = async (path: string) => {
    await window.electron.ipcRenderer.invoke('open-folder', path);
  };

  if (loading) {
    return <div className="loading">Loading extensions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
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
              <span className="instance-details-label">Type:</span>
              <span className="instance-details-value">{instance?.type}</span>
            </div>
            <div className="instance-details-item">
              <span className="instance-details-label">ID:</span>
              <span className="instance-details-value">{instance?.id}</span>
            </div>
          </div>
          <div className="instance-folders">
            <div className="instance-details-item folder-item">
              <div className="folder-path">
                <span className="instance-details-label">Instance Folder:</span>
                <span className="instance-details-value" title={instance?.instanceDir}>
                  {instance?.instanceDir}
                </span>
              </div>
              <div className="folder-actions">
                <button 
                  onClick={() => handleOpenFolder(instance?.instanceDir || '')}
                  className="action-button"
                  title="Open instance folder"
                >
                  <div className="button-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    Open
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
                  title="Copy path to clipboard"
                >
                  <div className="button-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span className="button-text">Copy</span>
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
              Open
            </div>
          </button>
          
          <button onClick={handleDelete} className="action-button delete-button">
            <div className="button-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </div>
          </button>
        </div>

        <div className="extensions-list">
          <h2>
            Extensions
            <span className="extension-count">{extensions.length}</span>
          </h2>
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
    </div>
  );
} 