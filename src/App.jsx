import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Recovery from './pages/Recovery';
import Vault from './pages/Vault';
import SharedSecret from './pages/SharedSecret';
import Landing from './pages/Landing';

function App() {
  return (
    <Router>
      <Routes>
        {/* Si entran a la raíz, los mandamos al login */}
        <Route path="/" element={<Landing />} />        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/share/:id" element={<SharedSecret />} />
        <Route path="/recovery" element={<Recovery />} />
      </Routes>
    </Router>
  );
}

export default App;