import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext'; // import AuthProvider
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import NotFound from './pages/NotFound';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

const AppContent = () => {
  const location = useLocation();
  const isUploadPage = location.pathname === '/upload';

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'StudyMate - AI Learning Assistant',
          text: 'Check out my study materials on StudyMate!',
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(() => {
          alert('Share clicked! URL: ' + window.location.href);
        });
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Navbar showShare={isUploadPage} onShare={handleShare} />
      <main className="transition-colors duration-300">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/notebook/:notebookId" element={<UploadPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider> {/* Wrap everything in AuthProvider */}
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
