import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewEditor.css';
import { loadInstances } from '../../App';
import { IconPicker } from '../IconPicker/IconPicker';
export function NewEditor() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'vscode' | 'cursor'>('vscode');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<{ title: string; svg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await window.electron.ipcRenderer.invoke('create-editor-instance', {
      name,
      type,
      icon: selectedIcon ? {
        title: selectedIcon.title,
        svg: selectedIcon.svg
      } : undefined
    });

    loadInstances();
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

        <div className="form-group">
          <label>Instance Icon</label>
          <button 
            type="button"
            className="icon-select-button"
            onClick={() => setShowIconPicker(true)}
          >
            {selectedIcon ? (
              <div className="selected-icon">
                <div 
                  className="icon-preview"
                  dangerouslySetInnerHTML={{ __html: selectedIcon.svg }} 
                />
                <span>{selectedIcon.title}</span>
              </div>
            ) : (
              <span>Choose Icon</span>
            )}
          </button>
        </div>

        <button type="submit" className="submit-button">
          Create Instance
        </button>
      </form>

      {showIconPicker && (
        <IconPicker
          onSelect={(icon) => {
            setSelectedIcon(icon);
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
} 