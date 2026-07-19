import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAIStore } from '../store/aiStore';
import {
  LogOut, User as UserIcon, LayoutDashboard, Users,
  Calendar, Pill, TestTube, FileText, Settings, Bell, Building, Check, Trash2, Sun, Moon,
  Menu, X, Map, BedDouble, Truck, Activity, Droplets, LineChart, Brain, ListOrdered, Bot, HeartPulse
} from 'lucide-react';
import api from '../services/api';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AIFloatingButton from '../components/AIAssistant/AIFloatingButton';
import AIDrawer from '../components/AIAssistant/AIDrawer';

const fetchNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data.data;
};

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { toggleDrawer } = useAIStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000 // Poll every 30s
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      logout();
    }
  };

  // Define navigation links based on roles
  const getNavLinks = () => {
    const role = user?.role;
    const links = [];

    // MAIN
    links.push({ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, category: 'MAIN' });

    if (role === 'RECEPTIONIST' || role === 'ADMIN') {
      links.push({ name: 'Patients', path: '/patients', icon: <Users size={20} />, category: 'MAIN' });
      links.push({ name: 'Appointments', path: '/appointments', icon: <Calendar size={20} />, category: 'MAIN' });
    }
    if (role === 'DOCTOR') {
      links.push({ name: 'My Patients', path: '/doctor/patients', icon: <Users size={20} />, category: 'MAIN' });
      links.push({ name: 'Schedule', path: '/doctor/schedule', icon: <Calendar size={20} />, category: 'MAIN' });
    }
    if (role === 'PATIENT') {
      links.push({ name: 'Our Doctors', path: '/patient/doctors', icon: <Users size={20} />, category: 'MAIN' });
      links.push({ name: 'My Appointments', path: '/patient/appointments', icon: <Calendar size={20} />, category: 'MAIN' });
      links.push({ name: 'Medical Records', path: '/patient/records', icon: <FileText size={20} />, category: 'MAIN' });
    }

    // OPERATIONS
    if (role === 'RECEPTIONIST' || role === 'ADMIN') {
      links.push({ name: 'Bed Management', path: '/operations/beds', icon: <BedDouble size={20} />, category: 'OPERATIONS' });
      links.push({ name: 'Emergency SOS', path: '/operations/emergency', icon: <Activity size={20} />, category: 'OPERATIONS' });
      links.push({ name: 'Ambulance', path: '/operations/ambulance', icon: <Truck size={20} />, category: 'OPERATIONS' });
      links.push({ name: 'Live Queue', path: '/operations/queue', icon: <ListOrdered size={20} />, category: 'OPERATIONS' });
    }
    if (role === 'DOCTOR') {
      links.push({ name: 'My Live Queue', path: '/doctor/live-queue', icon: <ListOrdered size={20} />, category: 'OPERATIONS' });
    }
    if (role === 'LAB_STAFF' || role === 'ADMIN') {
      links.push({ name: 'Blood Bank', path: '/operations/blood-bank', icon: <Droplets size={20} />, category: 'OPERATIONS' });
      links.push({ name: 'Organ Donation', path: '/operations/organ-donation', icon: <HeartPulse size={20} />, category: 'OPERATIONS' });
      links.push({ name: 'Lab Reports', path: '/lab/reports', icon: <TestTube size={20} />, category: 'OPERATIONS' });
    }
    if (role === 'PATIENT') {
      links.push({ name: 'Queue Status', path: '/patient/queue-status', icon: <ListOrdered size={20} />, category: 'OPERATIONS' });
    }

    // Facility Map fits well in Operations
    links.push({ name: 'Facility Map', path: '/facility-map', icon: <Map size={20} />, category: 'OPERATIONS' });

    // PHARMACY
    if (role === 'PHARMACIST' || role === 'ADMIN') {
      links.push({ name: 'Inventory', path: '/pharmacy/inventory', icon: <Pill size={20} />, category: 'PHARMACY' });
      links.push({ name: 'Analytics', path: '/pharmacy/analytics', icon: <LineChart size={20} />, category: 'PHARMACY' });
      links.push({ name: 'Prescriptions', path: '/pharmacy/history', icon: <FileText size={20} />, category: 'PHARMACY' });
    }

    // AI
    if (role === 'PHARMACIST' || role === 'ADMIN') {
      links.push({ name: 'AI Intelligence', path: '/pharmacy/intelligence', icon: <Brain size={20} />, category: 'AI' });
    }
    if (role === 'ADMIN') {
      links.push({ name: 'AI Analytics', path: '/admin#ai_analytics', icon: <Activity size={20} />, category: 'AI' });
    }

    // SETTINGS
    if (role === 'ADMIN') {
      links.push({ name: 'Staff Management', path: '/admin', icon: <Users size={20} />, category: 'SETTINGS' });
      links.push({ name: 'Hospital Settings', path: '/admin#settings', icon: <Settings size={20} />, category: 'SETTINGS' });
    }

    return links;
  };

  const navLinks = getNavLinks();
  const groupedLinks = ['MAIN', 'OPERATIONS', 'PHARMACY', 'AI', 'SETTINGS'].map(category => {
    return {
      category,
      links: navLinks.filter(link => link.category === category)
    };
  }).filter(group => group.links.length > 0);

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-gray-200 dark:border-gray-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:z-20
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MediCore Logo" className="w-8 h-8 object-contain" />
            <Link to="/" className="font-heading font-bold text-xl text-secondary dark:text-white tracking-tight">MediCore</Link>
          </div>
          {/* Close button - mobile only */}
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {groupedLinks.map((group) => (
            <div key={group.category} className="flex flex-col gap-1">
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 px-3 mt-1">
                {group.category}
              </div>
              {group.links.map((link) => {
                const isActive = location.pathname === link.path.split('#')[0] && (link.path.includes('#') ? location.hash === '#' + link.path.split('#')[1] : location.hash === '' || location.hash === '#overview');
                // Basic active state matching
                const isSimplyActive = isActive || (link.path !== '/dashboard' && link.path !== '/admin' && location.pathname.startsWith(link.path.split('#')[0]));

                return (
                  <motion.div whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }} key={link.name}>
                    <Link
                      to={link.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 font-medium text-sm ${isSimplyActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <span className={isSimplyActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}>{link.icon}</span>
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-surface">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-primary/10 p-2 rounded-full text-primary shadow-sm border border-primary/20">
              <UserIcon size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 font-medium capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-2.5 text-error hover:bg-error/10 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between px-4 md:px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu - mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-heading font-bold text-lg text-secondary dark:text-white capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4 relative">
            <button
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 font-medium text-sm"
              onClick={toggleDrawer}
            >
              <Bot size={16} />
              AI Assistant
            </button>

            <button
              className="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
              onClick={toggleTheme}
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              className="relative p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-primary/5"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              {unreadCount > 0 ? (
                <motion.div animate={{ rotate: [0, 15, -15, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 2 }}>
                  <Bell size={20} />
                </motion.div>
              ) : (
                <Bell size={20} />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute top-12 right-12 w-80 bg-surface dark:bg-background rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-surface/50">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications?.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-surface transition-colors flex gap-3 ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                          <Bell size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => markAsReadMutation.mutate(n.id)}
                            className="text-gray-400 hover:text-primary p-1"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications right now.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                <UserIcon size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content and Footer Container */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50/50 dark:bg-background">
          <div className="p-4 md:p-8 flex-1">
            <div className="max-w-[1600px] mx-auto">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </div>
          </div>

          {/* Global Footer */}
          <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-surface px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 shrink-0">
            <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <img src="/logo.png" alt="MediCore Logo" className="w-4 h-4 grayscale opacity-70" />
              MediCore HMS <span className="font-normal text-gray-400">| Version 1.0</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-3 md:mt-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="font-medium text-success/80">System Health 100%</span>
              </div>
              <div className="hidden md:block w-px h-3 bg-gray-300 dark:bg-gray-700"></div>
              <div className="flex items-center gap-1.5 font-medium">
                Last Backup: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Global AI Assistant Components */}
      <AIFloatingButton />
      <AIDrawer />
    </div>
  );
};

export default MainLayout;
