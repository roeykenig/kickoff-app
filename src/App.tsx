import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import Navbar from './components/Navbar';
import Home from './pages/HomeLive';
import LobbyDetail from './pages/LobbyDetailLive';
import CreateLobby from './pages/CreateLobbyPage';
import Register from './pages/RegisterPage';
import Login from './pages/LoginLive';
import Profile from './pages/ProfileLive';
import PostGameRating from './pages/PostGameRating';

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
              <Route path="/lobby/:id/rate" element={<PostGameRating />} />
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
