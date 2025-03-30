import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home';
import { NewEditor } from './components/NewEditor/NewEditor';
import { Settings } from './components/Settings/Settings';
import { Navigation } from './components/Navigation/Navigation';
import { Instance } from './components/Instance/Instance';
import { useSignals } from "@preact/signals-react/runtime";
import './App.css';
import { EditorInstance } from '../main/features/editor-instances/types';
import { signal } from '@preact/signals-react';
import { useEffect } from 'react';
import { CONST_IPC_CHANNELS } from '../main/features/shared/constants/names';


export const instances = signal<EditorInstance[]>([]);

export const loadInstances = async () => {
  const list = await window.electron.ipcRenderer.invoke(CONST_IPC_CHANNELS.LIST_EDITOR_INSTANCES);
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
            <Route path="/" element={<Home />} />
            <Route path="/instance/:id" element={<Instance />} />
            <Route path="/new" element={<NewEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
