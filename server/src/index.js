import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import labRoutes from './routes/lab.routes.js';
import pharmacyRoutes from './routes/pharmacy.routes.js';
import billingRoutes from './routes/billing.routes.js';
/*import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import patientRoutes from './routes/patient.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import publicRoutes from './routes/public.routes.js';
import departmentRoutes from './routes/department.routes.js';*/

// We will import more routes here as we build them

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const app = express();
const prisma = new PrismaClient({ adapter });

// Trust proxy if running behind a reverse proxy (like Render/Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev')); // HTTP request logger

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Very high limit for dev to prevent 429 errors
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
app.use('/api/', limiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/billing', billingRoutes);
/*app.use('/api/v1/users', userRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/departments', departmentRoutes);*/


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running healthily' });
});

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { app, prisma };
