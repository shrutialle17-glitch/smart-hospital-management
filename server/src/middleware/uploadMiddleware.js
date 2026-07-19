import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer to store files in memory buffers
const storage = multer.memoryStorage();
const localUpload = multer({ storage: storage });

// Wrapper to stream a file buffer directly to Cloudinary
const uploadStreamToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });
};

// Object exposing a .single() method that returns an array of middlewares:
// 1. The multer parser (to parse the multipart body)
// 2. The custom Cloudinary uploader (to stream the file and append secure_url to req.file.path)
export const uploadReport = {
  single: (fieldName) => [
    localUpload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          folder: 'novacare_lab_reports',
          allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
          resource_type: 'auto'
        });
        req.file.path = result.secure_url; // Set URL to match controller code expectation
        next();
      } catch (err) {
        next(err);
      }
    }
  ]
};

// Object exposing a .single() method for profile images
export const uploadProfileImage = {
  single: (fieldName) => [
    localUpload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          folder: 'novacare_avatars',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
        });
        req.file.path = result.secure_url; // Set URL to match controller code expectation
        next();
      } catch (err) {
        next(err);
      }
    }
  ]
};

// Expose a .single() method for Voice Notes (audio)
export const uploadVoiceNote = {
  single: (fieldName) => [
    localUpload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          folder: 'novacare_voice_notes',
          resource_type: 'video', // Cloudinary treats audio as video resource_type
        });
        req.file.path = result.secure_url;
        req.file.duration = result.duration; // Might be useful for metadata
        next();
      } catch (err) {
        next(err);
      }
    }
  ]
};

// Object exposing a .single() method for general Medical Records / Certificates
export const uploadMedicalRecord = {
  single: (fieldName) => [
    localUpload.single(fieldName),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          folder: 'novacare_medical_records',
          resource_type: isPdf ? 'raw' : 'auto'
        });
        req.file.path = result.secure_url;
        next();
      } catch (err) {
        next(err);
      }
    }
  ]
};
