import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewEditor.css';

export function NewEditor() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'vscode' | 'cursor'>('vscode');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await window.electron.ipcRenderer.invoke('create-editor-instance', {
      name,
      type
    });

    navigate('/');
  };

  return (
    <div className="new-editor-container">
      <h2>Add New Editor Instance</h2>
      
      <form onSubmit={handleSubmit} className="new-editor-form">
        <div className="form-group">
          <label htmlFor="name">Instance Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Editor Instance"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Editor Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'vscode' | 'cursor')}
          >
            <option value="vscode">VS Code</option>
            <option value="cursor">Cursor</option>
          </select>
        </div>

        <button type="submit" className="submit-button">
          Create Instance
        </button>
      </form>
    </div>
  );
} 