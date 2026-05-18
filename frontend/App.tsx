import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SearchPage } from './pages/SearchPage';
import { DetailsPage } from './pages/DetailsPage';
import { NavigationPage } from './pages/NavigationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
        setUser(savedUser);
    }
  }, []);

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('user_session', email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  return (
    <Router>
      <div className="w-full h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
            <Routes>
                <Route path="/login" element={
                    user ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />
                } />
                
                {/* Protected Routes */}
                <Route path="/" element={
                    user ? <SearchPage /> : <Navigate to="/login" replace />
                } />
                <Route path="/details/:id" element={
                    user ? <DetailsPage /> : <Navigate to="/login" replace />
                } />
                <Route path="/navigate/:id" element={
                    user ? <NavigationPage /> : <Navigate to="/login" replace />
                } />
                <Route path="/analytics" element={
                    user ? <AnalyticsPage /> : <Navigate to="/login" replace />
                } />
                <Route path="/settings" element={
                    user ? <SettingsPage onLogout={handleLogout} /> : <Navigate to="/login" replace />
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>

        {/* Global Components - Only show when logged in */}
        {user && (
            <>
                <NavBar />
                <GeminiAssistant />
            </>
        )}

      </div>
    </Router>
  );
};

export default App;