import React from 'react';
import { useNavigate } from 'react-router-dom';
import { instances } from '../App';
import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const instanceCount = instances.value.length;

  const handleCreateInstance = () => {
    navigate('/new');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Editor Instances</h1>
            <div className="instance-counter">
              {instanceCount} instance{instanceCount !== 1 ? 's' : ''}
            </div>
          </div>
          <button className="create-button" onClick={handleCreateInstance}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Instance
          </button>
        </div>
      </div>

      <div className="instances-grid">
        {instances.value.map((instance) => (
          <div key={instance.id} className="instance-card" onClick={() => navigate(`/instance/${instance.id}`)}>
            <div className="instance-icon">
              {instance.type === 'vscode' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="instance-info">
              <h3>{instance.name}</h3>
              <div className="instance-meta">
                <span className="instance-type">{instance.type}</span>
                <span className="instance-date">
                  {new Date(instance.lastUsed).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 