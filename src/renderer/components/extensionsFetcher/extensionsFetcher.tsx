import React, { useState } from 'react';
import './extensionsFetcher.css';
import { MarketplaceExtension } from '../../../main/features/editor-instances/types';

export function ExtensionsFetcher() {
  const [searchQuery, setSearchQuery] = useState('');
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setExtensions([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Sending search request for:', query);
      const results = await window.electron.ipcRenderer.invoke('search-extensions', query);
      console.log('Received results:', results);
      setExtensions(results);
    } catch (error) {
      console.error('Error searching extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = (extension: MarketplaceExtension) => {
    console.log('Installing extension:', extension);
  };

  return (
    <div className="extensions-container">
      <div className="extensions-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="extensions-list">
        {loading ? (
          <div className="loading">Searching extensions...</div>
        ) : (
          extensions.map((ext) => (
            <div key={ext.identifier.id} className="extension-item">
              {ext.icon && (
                <img 
                  src={ext.icon} 
                  alt={ext.displayName} 
                  className="extension-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="extension-info">
                <div className="extension-header">
                  <h3 className="extension-name">{ext.displayName}</h3>
                  <span className="extension-publisher">{ext.publisher}</span>
                </div>
                <p className="extension-description">{ext.description}</p>
                <button 
                  className="install-button"
                  onClick={() => handleInstall(ext)}
                >
                  Install
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 