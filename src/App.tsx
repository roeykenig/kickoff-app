import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LobbyDetail from './pages/LobbyDetail';
import CreateLobby from './pages/CreateLobby';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:id" element={<LobbyDetail />} />
            <Route path="/create" element={<CreateLobby />} />
          </Routes>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
