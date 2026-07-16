
import React, { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, Shield, HeartPulse, Activity, Phone, 
  ChevronDown, ChevronUp, ArrowRight, CheckCircle,
  Clock, MapPin, Star, Award, Building, User, Calendar, AlertTriangle, Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import Navbar from '../components/Navbar';

// --- Fictional Data ---
const stats = [
  { label: "Patients Served", value: "2M+", icon: <Users className="text-primary w-8 h-8" /> },
  { label: "Specialists", value: "500+", icon: <Stethoscope className="text-primary w-8 h-8" /> },
  { label: "Awards Won", value: "150+", icon: <Award className="text-primary w-8 h-8" /> },
  { label: "Years of Trust", value: "25+", icon: <Building className="text-primary w-8 h-8" /> }
];

const doctors = [
  { name: "Dr. Sarah Jenkins", role: "Chief of Surgery", exp: "15 Years Exp." },
  { name: "Dr. Marcus Thorne", role: "Head of Cardiology", exp: "22 Years Exp." },
  { name: "Dr. Emily Chen", role: "Lead Pediatrician", exp: "10 Years Exp." },
  { name: "Dr. James Wilson", role: "Neurology Specialist", exp: "18 Years Exp." }
];

const testimonials = [
  { text: "The care I received was absolutely phenomenal. The staff is compassionate and the facilities are state-of-the-art.", author: "Michael T.", rating: 5 },
  { text: "From the emergency room to the recovery ward, every doctor and nurse made me feel safe and respected.", author: "Sarah W.", rating: 5 },
  { text: "MediCore is a lifesaver, literally. Their cardiology team performed a miracle on my father.", author: "David L.", rating: 5 }
];

const faqs = [
  { q: "How do I book an appointment?", a: "You can easily book an appointment online by creating a Patient Account in our portal, or call our 24/7 helpline." },
  { q: "Do you accept international insurance?", a: "Yes, we partner with most global health insurance providers. Contact our billing department for specific inquiries." },
  { q: "What should I bring to my first visit?", a: "Please bring a valid photo ID, your insurance card, and any relevant previous medical records or prescriptions." },
  { q: "Are emergency services available 24/7?", a: "Yes, our advanced Level 1 Trauma Center is open 24 hours a day, 365 days a year to handle any critical emergencies." }
];

const partners = ["MedTech Global", "HealthCorp", "BioSynth", "CareAlliance", "VitalCare"];

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const Home = () => {
  const shouldReduceMotion = useReducedMotion();

  // Floating animation for background elements (disabled if reduced motion requested)
  const floatAnimation = shouldReduceMotion ? {} : {
    animate: { y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] },
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
  };

  const slowFloatAnimation = shouldReduceMotion ? {} : {
    animate: { y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] },
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image with optimized gradient for visibility & contrast */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/40 to-transparent dark:from-black/95 dark:via-black/60 dark:to-black/20"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/40 backdrop-blur-md border border-white/10 text-sm font-semibold text-white mb-6 shadow-xl">
              <Shield size={16} className="text-primary" />
              Excellence in Modern Medicine
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-[5rem] font-sans font-black text-white leading-[1.1] tracking-tight mb-6">
              World-Class <br />
              <span className="text-primary">Healthcare,</span><br />
              <span className="text-white/90">Human Touch.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/80 mb-8 max-w-lg leading-relaxed font-medium">
              Experience the pinnacle of medical care with MediCore’s state-of-the-art facilities and compassionate experts. Your health is our highest priority.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/30 text-lg px-8">
                  Book Appointment <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-error/90 hover:bg-error text-white border-error shadow-lg shadow-error/30 text-lg px-8 gap-2">
                <AlertTriangle className="w-5 h-5" /> Emergency SOS
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- STATISTICS SECTION --- */}
      <section className="py-12 bg-surface border-y border-gray-100 dark:border-gray-800 relative z-10 -mt-8 shadow-sm w-full px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                className="text-center flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {stat.icon}
                </div>
                <h3 className="text-4xl font-extrabold text-secondary dark:text-primary">{stat.value}</h3>
                <p className="text-gray-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ACHIEVEMENTS / SERVICES --- */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-heading font-bold text-secondary mb-4">Pioneering Medical Excellence</h2>
            <p className="text-gray-500 text-lg">We combine cutting-edge technology with world-renowned specialists to deliver unparalleled patient outcomes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-100 dark:border-gray-800 bg-surface">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Advanced Cardiology</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Our award-winning cardiovascular institute utilizes next-generation imaging and minimally invasive surgical techniques.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-100 dark:border-gray-800 bg-surface">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Neurology Center</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Comprehensive care for complex neurological conditions, supported by specialized neuro-intensive care units.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-100 dark:border-gray-800 bg-surface">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Precision Surgery</h3>
                <p className="text-gray-500 leading-relaxed text-sm">Equipped with robotic-assisted surgical systems for extreme precision, faster recovery, and minimal scarring.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- DOCTOR SHOWCASE --- */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-heading font-bold text-secondary mb-4">Meet Our Experts</h2>
              <p className="text-gray-500 text-lg max-w-xl">Our medical board consists of internationally recognized leaders in their respective fields.</p>
            </div>
            <Link to="/doctors">
              <Button variant="outline">View All Doctors</Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-background rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <div className="h-64 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
                  <User className="w-20 h-20 text-gray-400" />
                  <div className="absolute bottom-3 right-3 bg-white dark:bg-gray-900 rounded-full p-2 shadow-md">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{doc.name}</h3>
                  <p className="text-primary font-medium text-sm mb-2">{doc.role}</p>
                  <p className="text-gray-500 text-xs">{doc.exp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-heading font-bold text-secondary mb-16">Patient Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="bg-surface text-left border-none shadow-lg">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{t.author}</p>
                      <p className="text-xs text-gray-500">Verified Patient</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- EMERGENCY BANNER --- */}
      <section className="py-16 bg-error text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-2">Need Immediate Care?</h2>
            <p className="text-error-50 opacity-90 text-lg">Our Level 1 Trauma Center is on standby 24/7/365.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Button size="lg" className="bg-white text-error hover:bg-gray-100 shadow-xl border-none">
              <Phone className="mr-2 w-5 h-5" /> 911 / Emergency
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
              <MapPin className="mr-2 w-5 h-5" /> Get Directions
            </Button>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-surface" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-secondary mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-lg">Everything you need to know about your visit.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* --- PARTNERS --- */}
      <section className="py-12 border-t border-gray-100 dark:border-gray-800 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by Global Healthcare Partners</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {partners.map((p, i) => (
              <span key={i} className="text-2xl font-heading font-extrabold text-gray-500">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* --- MODERN FOOTER --- */}
      <footer className="bg-gray-900 text-gray-300 py-16 border-t-4 border-primary">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="MediCore Logo" className="w-8 h-8 object-contain" />
              <span className="font-heading font-bold text-2xl text-white tracking-tight">MediCore</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Redefining the standard of global healthcare with compassion, precision, and innovation.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"><Activity size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors"><HeartPulse size={18} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="hover:text-primary transition-colors">Patient Portal</Link></li>
              <li><Link to="/doctors" className="hover:text-primary transition-colors">Find a Doctor</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Specialties</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Billing & Insurance</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Legal & Policies</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Patient Rights</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Accessibility</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={18} className="text-primary shrink-0" /> 1234 Healing Way, Medical District, Metropolis, NY 10001</li>
              <li className="flex gap-3"><Phone size={18} className="text-primary shrink-0" /> (800) 555-0199</li>
              <li className="flex gap-3"><Clock size={18} className="text-primary shrink-0" /> 24/7 Emergency Care</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-sm text-center text-gray-500">
          &copy; {new Date().getFullYear()} MediCore Medical Center. All rights reserved. (Fictional Platform)
        </div>
      </footer>
    </div>
  );
};

// Simple FAQ Accordion Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-background">
      <button 
        className="w-full flex items-center justify-between p-6 text-left font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        {isOpen ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 mt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
