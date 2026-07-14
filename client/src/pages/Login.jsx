import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data; // wait, my API returns { data: { id, firstName, ..., token } }
      
      const userData = { ...response.data.data };
      delete userData.token;

      setAuth(userData, response.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Column (Brand & Illustration) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[50%] bg-[#84A98C] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        
        {/* Logo and Brand Name */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="MediCore Logo" className="w-10 h-10 object-contain brightness-0 invert" />
          <span className="font-heading font-bold text-2xl tracking-tight text-white">MediCore</span>
        </div>

        {/* Hero Illustration & Welcome message */}
        <div className="my-auto relative z-10 flex flex-col items-center text-center">
          <img 
            src="/login-illustration.png" 
            alt="Healthcare Illustration" 
            className="w-4/5 max-w-sm object-contain mb-8 hover:scale-105 transition-transform duration-500" 
          />
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold mb-4 leading-tight">
            Welcome Back to MediCore
          </h2>
          <p className="text-white/80 max-w-md text-sm lg:text-base leading-relaxed">
            Your single unified portal for smart hospital workflows, patient health management, and real-time medical updates.
          </p>
        </div>

        {/* Footer info inside left column */}
        <div className="text-xs text-white/60 relative z-10">
          &copy; {new Date().getFullYear()} MediCore Medical Center. All rights reserved.
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface dark:bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center md:hidden mb-8">
            <img src="/logo.png" alt="MediCore Logo" className="w-12 h-12 object-contain mb-3" />
            <h1 className="text-3xl font-heading font-bold text-secondary">MediCore</h1>
            <p className="text-text-primary/70 text-sm mt-1">Smart Hospital Management System</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white">Sign In</h2>
            <p className="text-gray-500 text-sm">Enter your credentials to access your portal</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                placeholder="admin@novacare.com"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#84A98C] hover:bg-secondary text-white font-semibold rounded-xl transition-all flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
