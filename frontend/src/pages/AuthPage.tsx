import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

import { auth } from '../services/api';
import { ParklyLogo } from '../components/ParklyLogo';

interface AuthPageProps {
  onLogin: (userData: { name: string; email: string; licensePlate?: string; preferences?: any }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'spot_owner'>('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login: must get valid response from backend
        const response = await auth.login(email, password);
        
        // Double-check: response must have token and user
        if (!response || !response.token || !response.user) {
          throw new Error('Invalid response from server');
        }
        
        // Only call onLogin if we have valid authenticated data
        onLogin(response.user);
      } else {
        // Register: create account first
        await auth.register(name, email, password, accountType);
        
        // Auto login after successful registration
        const response = await auth.login(email, password);
        
        // Double-check: response must have token and user
        if (!response || !response.token || !response.user) {
          throw new Error('Registration successful but login failed. Please try logging in manually.');
        }
        
        // Only call onLogin if we have valid authenticated data
        onLogin(response.user);
      }
    } catch (err: any) {
      // Show error message - login should NOT proceed
      const errorMessage = err.message || err.response?.data?.error || 'Authentication failed. Please ensure the backend server is running.';
      setError(errorMessage);
      console.error('Authentication error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600 rounded-full filter blur-[80px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-600 rounded-full filter blur-[80px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl z-10">
        <div className="text-center mb-8">
          <ParklyLogo
            orientation="vertical"
            className="mx-auto"
            textClassName="text-white"
            subtitle="Smart parking companion"
          />
          <p className="text-slate-300 mt-4">Find your spot in seconds with Parkly.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                required={!isLogin}
              />
            </div>
          )}

          {!isLogin && (
            <div className="flex gap-3 text-sm text-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="user"
                  checked={accountType === 'user'}
                  onChange={() => setAccountType('user')}
                  className="accent-blue-500"
                />
                <span>Driver account</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="spot_owner"
                  checked={accountType === 'spot_owner'}
                  onChange={() => setAccountType('spot_owner')}
                  className="accent-emerald-500"
                />
                <span>Spot owner</span>
              </label>
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {isLogin ? 'Log In' : 'Create Account'}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-400 font-bold hover:text-blue-300 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};