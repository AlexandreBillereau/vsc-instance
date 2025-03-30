import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewEditor.css';
import { loadInstances } from '../../App';
import { IconPicker } from '../IconPicker/IconPicker';
import { EditorInstance } from '../../../main/features/editor-instances/types';
import { CONST_IPC_CHANNELS } from '../../../main/features/shared/constants/names';

export function NewEditor() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'vscode' | 'cursor'>('vscode');
  const [useTemplate, setUseTemplate] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<{ title: string; svg: string } | null>(null);
  const [templateInstance, setTemplateInstance] = useState<EditorInstance | null>(null);
  const [errors, setErrors] = useState<{ name?: string; type?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; type?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Instance name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.CREATE_EDITOR_INSTANCE, {
      name: name.trim(),
      type,
      icon: selectedIcon ? {
        title: selectedIcon.title,
        svg: selectedIcon.svg
      } : undefined,
      useTemplate
    });

    loadInstances();
    navigate('/');
  };

  const handleImportInstance = async () => {
    const result = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.IMPORT_INSTANCE);
    if (result) {
      loadInstances();
      navigate('/');
    }
  };

  const fetchTemplateInstance = async () => {
    const instance = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.GET_TEMPLATE_INSTANCE);
    setTemplateInstance(instance);
  }

  useEffect(() => {
    
    fetchTemplateInstance();
  }, []);

  return (
    <div className="new-editor-container">
      <div className="new-editor-header">
        <div className="header-content">
          <h2>New Editor Instance</h2>
          <div className="header-actions">
            <button 
              type="button" 
              onClick={handleImportInstance} 
              className="import-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import Instance
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="new-editor-form">
        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="name" className="required">Instance Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder="My Editor Instance"
            required
          />
          <span className="field-description">
            {errors.name || 'Choose a descriptive name for your editor instance (e.g., "Python Development", "Web Projects")'}
          </span>
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
          <span className="field-description">
            Select your preferred editor. Each instance will be completely isolated from others.
          </span>
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
          <span className="field-description">
            Add a visual identifier to easily recognize this instance in the sidebar
          </span>
        </div>

        {templateInstance && (
          <div className="form-group">
            <div className="checkbox-container">
              <input
                id="use-template"
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
              />
              <label htmlFor="use-template">Use Core Template</label>
            </div>
            <span className="field-description">
              Start with extensions and settings from your Core Template. Recommended for consistency across instances.
            </span>
          </div>
        )}

        <button type="submit" className="submit-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
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