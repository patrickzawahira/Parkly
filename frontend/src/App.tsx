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
import { ParkedPage } from './pages/ParkedPage';
import { voiceService } from './services/voiceService';

interface UserData {
  name: string;
  email: string;
  licensePlate?: string;
  personalInfo?: {
    phone?: string;
    address?: string;
  };
  paymentMethods?: Array<{
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
  }>;
  preferences?: {
    accessibility?: {
      highContrast?: boolean;
      largeText?: boolean;
      voiceGuidance?: boolean;
    };
    app?: {
      notifications?: boolean;
      darkMode?: 'light' | 'dark' | 'system';
    };
  };
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);

  // Check for existing session on load and verify with backend
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user_session');
      
      if (token && savedUser) {
        try {
          // Verify token with backend and get fresh user data
          const { user: userApi } = await import('./services/api');
          const userData = await userApi.getProfile();
          setUser(userData);
          localStorage.setItem('user_session', JSON.stringify(userData));
          
          // Apply voice guidance setting
          if (userData.preferences?.accessibility?.voiceGuidance !== undefined) {
            voiceService.setEnabled(userData.preferences.accessibility.voiceGuidance);
          }
          
        } catch (e) {
          // Token invalid or backend unavailable - clear session
          console.error('Session verification failed:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          setUser(null);
          voiceService.setEnabled(false);
        }
      }
    };
    
    verifySession();
  }, []);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    
    // Apply voice guidance setting on login
    if (userData.preferences?.accessibility?.voiceGuidance !== undefined) {
      voiceService.setEnabled(userData.preferences.accessibility.voiceGuidance);
    }
    
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
  };

  const handleUserUpdate = (updatedUser: UserData) => {
    setUser(updatedUser);
    localStorage.setItem('user_session', JSON.stringify(updatedUser));
    
    // Update voice guidance based on user preferences
    if (updatedUser.preferences?.accessibility?.voiceGuidance !== undefined) {
      voiceService.setEnabled(updatedUser.preferences.accessibility.voiceGuidance);
    }
    
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
            <Route path="/parked" element={
              user ? <ParkedPage /> : <Navigate to="/login" replace />
            } />
            <Route path="/settings" element={
              user ? <SettingsPage user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} /> : <Navigate to="/login" replace />
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