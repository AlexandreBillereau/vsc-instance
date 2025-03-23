import React, { useEffect, useState } from 'react';
import './InstancesList.css';

interface EditorInstance {
  id: string;
  name: string;
  type: 'vscode' | 'cursor';
  workspaceFolder?: string;
  lastUsed: string;
}

export function InstancesList() {
  const [instances, setInstances] = useState<EditorInstance[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedType, setSelectedType] = useState<'vscode' | 'cursor'>('vscode');

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    const list = await window.electron.ipcRenderer.invoke('list-editor-instances');
    setInstances(list);
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName) return;

    await window.electron.ipcRenderer.invoke('create-editor-instance', {
      name: newInstanceName,
      type: selectedType
    });

    setNewInstanceName('');
    loadInstances();
  };

  const handleOpenInstance = async (instanceId: string) => {
    await window.electron.ipcRenderer.invoke('open-editor-instance', instanceId);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await window.electron.ipcRenderer.invoke('delete-editor-instance', instanceId);
    loadInstances();
  };

  return (
    <div className="instances-container">
      <h2>Mes Instances d'Éditeur</h2>
      
      <div className="create-instance">
        <input
          type="text"
          value={newInstanceName}
          onChange={(e) => setNewInstanceName(e.target.value)}
          placeholder="Nom de la nouvelle instance"
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'vscode' | 'cursor')}
        >
          <option value="vscode">VS Code</option>
          <option value="cursor">Cursor</option>
        </select>
        <button onClick={handleCreateInstance}>Créer une instance</button>
      </div>

      <div className="instances-list">
        {instances.map((instance) => (
          <div key={instance.id} className="instance-card">
            <div className="instance-info">
              <h3>{instance.name}</h3>
              <p>Type: {instance.type}</p>
              <p>Dernière utilisation: {new Date(instance.lastUsed).toLocaleDateString()}</p>
            </div>
            <div className="instance-actions">
              <button onClick={() => handleOpenInstance(instance.id)}>
                Ouvrir
              </button>
              <button 
                onClick={() => handleDeleteInstance(instance.id)}
                className="delete-button"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 