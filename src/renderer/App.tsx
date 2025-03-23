import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { InstancesList } from './components/InstancesList';
import { NewEditor } from './components/NewEditor/NewEditor';
import { Settings } from './components/Settings/Settings';
import { Navigation } from './components/Navigation/Navigation';
import { Instance } from './components/Instance/Instance';
import './App.css';

export default function App() {
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
