import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LogOut, User as UserIcon, LayoutDashboard, Users, 
  Calendar, Pill, TestTube, FileText, Settings, Bell, Building, Check, Trash2, Sun, Moon
} from 'lucide-react';
import api from '../services/api';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const fetchNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data.data;
};

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
    const links = [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> }
    ];

    if (role === 'ADMIN') {
      links.push({ name: 'Staff Management', path: '/admin', icon: <Users size={20} />, roles: ['ADMIN'] });
    }
    
    if (role === 'RECEPTIONIST' || role === 'ADMIN') {
      links.push({ name: 'Patients', path: '/patients', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] });
      links.push({ name: 'Appointments', path: '/appointments', icon: <Calendar size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] });
    }

    if (role === 'DOCTOR') {
      links.push({ name: 'My Patients', path: '/doctor/patients', icon: <Users size={20} />, roles: ['DOCTOR'] });
      links.push({ name: 'Schedule', path: '/doctor/schedule', icon: <Calendar size={20} />, roles: ['DOCTOR'] });
    }

    if (role === 'PHARMACIST' || role === 'ADMIN') {
      links.push({ name: 'Inventory', path: '/pharmacy/inventory', icon: <Pill size={20} />, roles: ['ADMIN', 'PHARMACIST'] });
      links.push({ name: 'Prescription History', path: '/pharmacy/history', icon: <FileText size={20} />, roles: ['ADMIN', 'PHARMACIST'] });
    }

    if (role === 'LAB_STAFF' || role === 'ADMIN') {
      links.push({ name: 'Lab Reports', path: '/lab/reports', icon: <TestTube size={20} />, roles: ['ADMIN', 'LAB_STAFF'] });
    }

    if (role === 'PATIENT') {
      links.push({ name: 'Our Doctors', path: '/patient/doctors', icon: <Users size={20} />, roles: ['PATIENT'] });
      links.push({ name: 'My Appointments', path: '/patient/appointments', icon: <Calendar size={20} />, roles: ['PATIENT'] });
      links.push({ name: 'Medical Records', path: '/patient/records', icon: <FileText size={20} />, roles: ['PATIENT'] });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-gray-100 dark:border-gray-800 flex flex-col z-20 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <img src="/logo.png" alt="MediCore Logo" className="w-8 h-8 object-contain" />
          <Link to="/" className="font-heading font-bold text-xl text-secondary dark:text-white tracking-tight">MediCore</Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3 mt-2">Main Menu</div>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
            return (
              <Link 
                key={link.name} 
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm ${
                  isActive 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}>{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-[#84A98C]/10 p-2 rounded-full text-primary">
              <UserIcon size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-2 text-error hover:bg-error/5 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-surface/85 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="font-heading font-bold text-lg text-secondary dark:text-white capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 relative">
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
              <Bell size={20} />
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

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-background">
          <div className="max-w-7xl mx-auto">
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
      </main>
    </div>
  );
};

export default MainLayout;
