import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHome ? 'bg-white dark:bg-gray-900 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MediCore Logo" className="w-10 h-10 object-contain" />
          <span className={`font-heading font-bold text-2xl tracking-tight ${isScrolled || !isHome ? 'text-secondary dark:text-white' : 'text-white'}`}>MediCore</span>
        </Link>

        {/* Desktop Links */}
        <div className={`hidden md:flex items-center gap-8 font-medium text-sm ${isScrolled || !isHome ? 'text-gray-700 dark:text-gray-300' : 'text-white/90'}`}>
          <Link to="/" onClick={() => window.scrollTo({ top: 0 })} className="hover:text-primary transition-colors">Home</Link>
          <Link to="/#services" className="hover:text-primary transition-colors">Services</Link>
          <Link to="/doctors" className="hover:text-primary transition-colors">Our Doctors</Link>
          <Link to="/#faq" className="hover:text-primary transition-colors">FAQ</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            className={`p-2 transition-colors rounded-full hover:bg-primary/5 ${isScrolled || !isHome ? 'text-gray-500 dark:text-gray-400 hover:text-primary' : 'text-white hover:text-primary'}`}
            onClick={toggleTheme}
            title="Toggle Dark Mode"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="flex items-center gap-2 shadow-lg shadow-primary/20">
                <User size={16} />
                My Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className={`text-sm font-medium transition-colors ${isScrolled || !isHome ? 'text-text-primary dark:text-gray-200 hover:text-primary' : 'text-white/90 hover:text-primary'}`}>Log In</Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            className={`p-2 transition-colors rounded-full ${isScrolled || !isHome ? 'text-gray-500 dark:text-gray-400 hover:text-primary' : 'text-white hover:text-primary'}`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button className={`transition-colors ${isScrolled || !isHome ? 'text-gray-800 dark:text-white' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Link to="/" onClick={() => { window.scrollTo({ top: 0 }); setMobileMenuOpen(false); }} className="hover:text-primary transition-colors">Home</Link>
                <Link to="/#services" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">Services</Link>
                <Link to="/doctors" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">Our Doctors</Link>
                <Link to="/#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">FAQ</Link>
              </div>
              <hr className="border-gray-100 dark:border-gray-800" />
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center flex items-center gap-2">
                    <User size={16} /> My Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Log In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-center">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
