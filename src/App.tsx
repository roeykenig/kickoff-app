import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LobbyDetail from './pages/LobbyDetail';
import CreateLobby from './pages/CreateLobby';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lobby/:id" element={<LobbyDetail />} />
              <Route path="/create" element={<CreateLobby />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile/:id" element={<Profile />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
