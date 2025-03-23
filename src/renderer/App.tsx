import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { InstancesList } from './components/InstancesList';
import { NewEditor } from './components/NewEditor/NewEditor';
import { Settings } from './components/Settings/Settings';
import { Navigation } from './components/Navigation/Navigation';
import { Instance } from './components/Instance/Instance';
import { useSignals } from "@preact/signals-react/runtime";
import './App.css';
import { EditorInstance } from '../main/features/editor-instances/types';
import { signal } from '@preact/signals-react';
import { useEffect } from 'react';


export const instances = signal<EditorInstance[]>([]);

export const loadInstances = async () => {
  const list = await window.electron.ipcRenderer.invoke('list-editor-instances');
  instances.value = list;
};

export default function App() {
  useSignals();

  useEffect(() => {
    loadInstances();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<InstancesList />} />
            <Route path="/instance/:id" element={<Instance />} />
            <Route path="/new" element={<NewEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
