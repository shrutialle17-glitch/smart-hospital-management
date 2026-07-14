import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dob: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Register the patient
      await api.post('/auth/register', formData);
      
      // 2. Automatically log them in after successful registration
      const loginResponse = await api.post('/auth/login', { 
        email: formData.email, 
        password: formData.password 
      });
      
      const userData = { ...loginResponse.data.data };
      delete userData.token;

      setAuth(userData, loginResponse.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Column (Brand & Illustration) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[50%] bg-[#84A98C] text-white p-12 flex-col justify-between relative overflow-hidden shrink-0">
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
            className="w-4/5 max-w-xs object-contain mb-8 hover:scale-105 transition-transform duration-500" 
          />
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold mb-4 leading-tight">
            Join MediCore Today
          </h2>
          <p className="text-white/80 max-w-md text-sm lg:text-base leading-relaxed">
            Create your patient account to request appointments, view medical invoices, access lab results, and connect with your care team.
          </p>
        </div>

        {/* Footer info inside left column */}
        <div className="text-xs text-white/60 relative z-10">
          &copy; {new Date().getFullYear()} MediCore Medical Center. All rights reserved.
        </div>
      </div>

      {/* Right Column (Auth Form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface dark:bg-background overflow-y-auto">
        <div className="w-full max-w-xl space-y-8 py-8">
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center md:hidden mb-8">
            <img src="/logo.png" alt="MediCore Logo" className="w-12 h-12 object-contain mb-3" />
            <h1 className="text-3xl font-heading font-bold text-secondary">MediCore</h1>
            <p className="text-text-primary/70 text-sm mt-1">Smart Hospital Management System</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white">Patient Registration</h2>
            <p className="text-gray-500 text-sm">Create your personal health portal account</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">First Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                  placeholder="Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">Date of Birth</label>
                <input 
                  type="date" 
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface text-gray-700 dark:text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary">Gender</label>
                <select 
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface text-gray-700 dark:text-gray-200"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">Create Password</label>
              <input 
                type="password" 
                required
                minLength="6"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white/50 dark:bg-surface"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400">Must be at least 6 characters long.</p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#84A98C] hover:bg-secondary text-white font-semibold rounded-xl transition-all flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
