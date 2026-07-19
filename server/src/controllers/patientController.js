import { prisma } from '../index.js';
import bcrypt from 'bcrypt';

export const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const where = {};
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } }
        },
        orderBy: { user: { createdAt: 'desc' } }
      }),
      prisma.patient.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      meta: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check RBAC bounds
    if (req.user.role === 'PATIENT') {
      const selfPatient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (selfPatient?.id !== id) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } },
        medicalRecords: { orderBy: { date: 'desc' }, take: 5 },
        prescriptions: { orderBy: { date: 'desc' }, take: 5, include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      }
    });

    if (!patient) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const updatePatientProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bloodGroup, address, emergencyContact, allergies, chronicConditions } = req.body;

    // Check RBAC bounds
    if (req.user.role === 'PATIENT') {
      const selfPatient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (selfPatient?.id !== id) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        bloodGroup,
        address,
        emergencyContact,
        allergies,
        chronicConditions
      }
    });

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const registerWalkInPatient = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, dob, gender, bloodGroup, address, emergencyContact } = req.body;

    if (!email || !password || !firstName || !lastName || !dob || !gender) {
       return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT_ERROR', message: 'Email already registered' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: 'PATIENT',
        patientProfile: {
          create: {
            dob: new Date(dob),
            gender,
            bloodGroup: bloodGroup === "" ? null : bloodGroup,
            address: address === "" ? null : address,
            emergencyContact: emergencyContact === "" ? null : emergencyContact
          }
        }
      },
      include: { patientProfile: true }
    });

    res.status(201).json({ success: true, data: user.patientProfile });
  } catch (error) {
    next(error);
  }
};

export const addMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recordType, description, date } = req.body;

    if (!recordType || !description) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: id,
        recordType,
        description,
        date: date ? new Date(date) : new Date(),
        fileUrl: req.file?.path || null
      }
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getPatientTimeline = async (req, res, next) => {
  try {
    let { id } = req.params; // Patient ID

    // If 'me' is used, fetch the logged-in user's patient profile
    if (id === 'me') {
       if (req.user.role !== 'PATIENT') {
          return res.status(403).json({ success: false, error: { message: "Only patients can use 'me' alias." } });
       }
       const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
       if (!patient) return res.status(404).json({ success: false, error: { message: "Patient profile not found." } });
       id = patient.id;
    } else {
      // RBAC Security Check: If user is PATIENT, they can only view their own timeline
      if (req.user.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
        if (!patient || patient.id !== id) {
          return res.status(403).json({ success: false, error: { message: "Access denied. You can only view your own timeline." } });
        }
      }
    }

    // Fetch appointments first to get their IDs
    const appointments = await prisma.appointment.findMany({ where: { patientId: id }, include: { doctor: { include: { user: true } } } });
    const appointmentIds = appointments.map(a => a.id);

    // Fetch remaining data concurrently
    const [medicalRecords, prescriptions, labReports, bills, voiceNotes] = await Promise.all([
      prisma.medicalRecord.findMany({ where: { patientId: id } }),
      prisma.prescription.findMany({ where: { patientId: id }, include: { doctor: { include: { user: true } } } }),
      prisma.labReport.findMany({ where: { patientId: id }, include: { test: true } }),
      prisma.bill.findMany({ where: { patientId: id } }),
      prisma.voiceNote.findMany({ where: { consultationId: { in: appointmentIds } }, include: { doctor: { include: { user: true } } } })
    ]);

    // Map into a uniform timeline event structure
    const timeline = [];

    appointments.forEach(app => timeline.push({
      id: app.id, type: 'APPOINTMENT', date: app.date,
      title: `Appointment with Dr. ${app.doctor.user.lastName}`,
      description: `Status: ${app.status} | Reason: ${app.reason || 'N/A'}`
    }));

    medicalRecords.forEach(rec => timeline.push({
      id: rec.id, type: 'MEDICAL_RECORD', date: rec.date,
      title: `Medical Record: ${rec.recordType}`,
      description: rec.description,
      fileUrl: rec.fileUrl || null
    }));

    prescriptions.forEach(rx => timeline.push({
      id: rx.id, type: 'PRESCRIPTION', date: rx.date,
      title: `Prescription from Dr. ${rx.doctor.user.lastName}`,
      description: `Status: ${rx.status} | Notes: ${rx.notes || 'N/A'}`
    }));

    labReports.forEach(lab => timeline.push({
      id: lab.id, type: 'LAB_REPORT', date: lab.date,
      title: `Lab Test: ${lab.test.name}`,
      description: `Status: ${lab.status} | Result: ${lab.result || 'Pending'}`
    }));

    bills.forEach(bill => timeline.push({
      id: bill.id, type: 'BILL', date: bill.createdAt,
      title: `Invoice Generated`,
      description: `Total: $${bill.totalAmount} | Status: ${bill.status}`
    }));

    voiceNotes.forEach(note => timeline.push({
      id: note.id, type: 'VOICE_NOTE', date: note.createdAt,
      title: `Clinical Voice Note: Dr. ${note.doctor.user.lastName}`,
      description: 'Audio consultation summary',
      fileUrl: note.url
    }));

    // Sort by date descending (newest first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
};
