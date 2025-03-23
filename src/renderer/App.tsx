import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { InstancesList } from './components/InstancesList';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InstancesList />} />
      </Routes>
    </Router>
  );
}
