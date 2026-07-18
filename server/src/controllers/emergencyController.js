import { prisma } from '../index.js';

// GET /api/v1/emergency/status — unified emergency dashboard status
export const getEmergencyStatus = async (req, res, next) => {
  try {
    const [icuBeds, activeAmbulances, criticalBlood] = await Promise.all([
      // ICU bed count
      prisma.bed.count({ where: { type: 'ICU', status: 'AVAILABLE' } }),
      // Active ambulance dispatches
      prisma.ambulanceRequest.count({ where: { status: { in: ['REQUESTED', 'DISPATCHED', 'EN_ROUTE'] } } }),
      // Critical blood requests
      prisma.bloodRequest.count({ where: { urgency: 'CRITICAL', status: 'PENDING' } })
    ]);

    res.json({
      success: true,
      data: {
        availableIcuBeds: icuBeds,
        activeAmbulanceDispatches: activeAmbulances,
        criticalBloodRequests: criticalBlood
      }
    });
  } catch (err) { next(err); }
};

// POST /api/v1/emergency/dispatch-ambulance
// This acts as a wrapper that internally calls the ambulance module logic
export const dispatchEmergencyAmbulance = async (req, res, next) => {
  try {
    const { patientId, pickupAddress, notes } = req.body;
    const requestedById = req.user.id;

    // Find first available ambulance
    const availableAmbulance = await prisma.ambulance.findFirst({
      where: { status: 'AVAILABLE' }
    });

    let actualPatientId = patientId;
    if (!actualPatientId) {
      const p = await prisma.patient.findFirst();
      if (p) actualPatientId = p.id;
    }

    const data = {
      requestedById,
      pickupAddress: pickupAddress || 'Emergency Location (Auto-detected)',
      priority: 'CRITICAL',
      notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]',
      destination: 'NovaCare Emergency Room',
    };

    if (actualPatientId) data.patientId = actualPatientId;

    if (availableAmbulance) {
      data.ambulanceId = availableAmbulance.id;
      data.status = 'DISPATCHED';
      data.dispatchedAt = new Date();
      // Sync ambulance status
      await prisma.ambulance.update({
        where: { id: availableAmbulance.id },
        data: { status: 'DISPATCHED' }
      });
    } else {
      data.status = 'REQUESTED';
    }

    const request = await prisma.ambulanceRequest.create({
      data,
      include: { ambulance: true }
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// POST /api/v1/emergency/request-icu
// Wrapper for bed assignment
export const requestIcuBed = async (req, res, next) => {
  try {
    const { patientId, notes } = req.body;

    const availableBed = await prisma.bed.findFirst({
      where: { type: 'ICU', status: 'AVAILABLE' },
      include: { ward: true }
    });

    if (!availableBed) {
      return res.status(400).json({
        success: false,
        error: { message: 'No ICU beds currently available' }
      });
    }

    let actualPatientId = patientId;
    if (!actualPatientId) {
      const p = await prisma.patient.findFirst();
      if (p) actualPatientId = p.id;
    }

    if (!actualPatientId) {
       return res.status(400).json({ success: false, error: { message: 'No patient available in DB to assign' } });
    }

    const [updatedBed, assignment] = await prisma.$transaction([
      prisma.bed.update({
        where: { id: availableBed.id },
        data: { status: 'OCCUPIED', currentPatientId: actualPatientId },
        include: { ward: true, currentPatient: { include: { user: { select: { firstName: true, lastName: true } } } } }
      }),
      prisma.bedAssignment.create({
        data: { bedId: availableBed.id, patientId: actualPatientId, notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]' }
      })
    ]);

    res.json({ success: true, data: { bed: updatedBed, assignment } });
  } catch (err) { next(err); }
};

// POST /api/v1/emergency/request-blood
// Wrapper for blood bank request
export const requestEmergencyBlood = async (req, res, next) => {
  try {
    const { patientId, bloodGroup, units, notes } = req.body;
    const requestedById = req.user.id;

    let actualPatientId = patientId;
    if (!actualPatientId) {
      const p = await prisma.patient.findFirst();
      if (p) actualPatientId = p.id;
    }

    const request = await prisma.bloodRequest.create({
      data: {
        patientId: actualPatientId || null,
        requestedById,
        bloodGroup,
        units: parseInt(units),
        urgency: 'CRITICAL',
        department: 'Emergency',
        notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]'
      }
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// POST /api/v1/emergency/assign-doctor
export const assignEmergencyDoctor = async (req, res, next) => {
  try {
    const { patientId, notes } = req.body;
    
    // Find an available doctor (for demo, just find first)
    const availableDoctor = await prisma.doctor.findFirst({
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    if (!availableDoctor) {
      return res.status(400).json({ success: false, error: { message: 'No doctors available' } });
    }

    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hr

    let data = {
      doctorId: availableDoctor.id,
      date: now,
      startTime: now,
      endTime: end,
      status: 'CONFIRMED',
      reason: 'EMERGENCY',
      notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]',
    };

    if (patientId) {
      data.patientId = patientId;
    } else {
      // If no patient passed, assign a random patient just to fulfill schema
      const patient = await prisma.patient.findFirst();
      if (patient) data.patientId = patient.id;
      else return res.status(400).json({ success: false, error: { message: 'No patient available for emergency assignment' }});
    }

    const appointment = await prisma.appointment.create({
      data,
      include: { doctor: { include: { user: true } } }
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) { next(err); }
};
