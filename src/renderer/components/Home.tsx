import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instances } from '../App';
import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const instanceCount = instances.value.length;
  const [isGettingStartedVisible, setIsGettingStartedVisible] = useState(instanceCount === 0);

  const handleCreateInstance = () => {
    navigate('/new');
  };

  const handleOpenTemplate = () => {
    navigate('/settings');
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
            <button 
              className="help-button" 
              onClick={() => setIsGettingStartedVisible(!isGettingStartedVisible)}
              title={isGettingStartedVisible ? "Hide guide" : "Show guide"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="header-actions">
            <button className="template-button" onClick={handleOpenTemplate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Core Template
            </button>
            <button className="create-button" onClick={handleCreateInstance}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Instance
            </button>
          </div>
        </div>
      </div>

      {isGettingStartedVisible && (
        <div className="getting-started">
          <div className="getting-started-header">
            <h2>Getting Started</h2>
            <button className="close-button" onClick={() => setIsGettingStartedVisible(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Set Up Core Template</h3>
                <p>Create and configure your Core Template with essential extensions and settings that will be shared across instances.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Create an Instance</h3>
                <p>Create a new editor instance based on your needs. You can choose to inherit settings from the Core Template.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Customize Your Instance</h3>
                <p>Add specific extensions and settings to your instance while maintaining the core configuration.</p>
              </div>
            </div>
          </div>
          <div className="getting-started-footer">
            <button className="primary-button" onClick={handleOpenTemplate}>Configure Core Template</button>
            <button className="secondary-button" onClick={() => setIsGettingStartedVisible(false)}>Got it</button>
          </div>
        </div>
      )}

      <div className="instances-grid">
        {instances.value.map((instance) => (
          console.log(instance),
          <div key={instance.id} className="instance-card" onClick={() => navigate(`/instance/${instance.id}`)}>
            <div className="instance-icon">
              {instance.icon?.svg && (
                <div dangerouslySetInnerHTML={{ __html: instance.icon.svg }} />
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