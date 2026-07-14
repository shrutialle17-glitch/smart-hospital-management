import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, User, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import api from '../services/api';

const DoctorsPage = () => {
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['publicDoctors'],
    queryFn: async () => {
      const { data } = await api.get('/public/doctors');
      return data.data;
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-4">Our Medical Experts</h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Meet our team of highly qualified and experienced doctors dedicated to providing you with the best possible care. 
              Find a specialist and book your appointment today.
            </p>
          </div>

          <div className="bg-surface p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-12 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by doctor name or specialty..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-gray-50/50"
              />
            </div>
            <Button className="hidden md:flex">Search</Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 mx-auto" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mx-auto" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-full pt-4" />
                </div>
              ))}
            </div>
          ) : doctors?.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {doctors.map(doctor => (
                <Card key={doctor.id} className="hover:shadow-md transition-all duration-200 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-surface group overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="h-56 bg-primary/5 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 overflow-hidden relative shrink-0">
                      {doctor.profileImage ? (
                        <img src={doctor.profileImage} alt={doctor.firstName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <User size={64} className="text-primary/30 group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-6 text-center flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Dr. {doctor.firstName} {doctor.lastName}</h3>
                      <p className="text-primary text-sm font-semibold mb-4">{doctor.doctorProfile?.department?.name || 'General Medicine'}</p>
                      
                      <div className="space-y-2 mb-6 text-sm text-gray-500 flex-1">
                        <p>{doctor.doctorProfile?.qualifications || 'MBBS, MD'}</p>
                        <p>{doctor.doctorProfile?.experience || 5}+ Years Experience</p>
                      </div>

                      <Link to="/login" className="mt-auto">
                        <Button className="w-full group-hover:bg-[#84A98C] transition-colors text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20 bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <User size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No Specialists Found</h3>
              <p className="text-sm text-gray-400">Please adjust your search terms or check back later.</p>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} MediCore Hospital Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DoctorsPage;
