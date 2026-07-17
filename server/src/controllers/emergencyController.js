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

    const data = {
      requestedById,
      pickupAddress,
      priority: 'CRITICAL',
      notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]',
      destination: 'NovaCare Emergency Room',
    };

    if (patientId) data.patientId = patientId;

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

    const [updatedBed, assignment] = await prisma.$transaction([
      prisma.bed.update({
        where: { id: availableBed.id },
        data: { status: 'OCCUPIED', currentPatientId: patientId },
        include: { ward: true, currentPatient: { include: { user: { select: { firstName: true, lastName: true } } } } }
      }),
      prisma.bedAssignment.create({
        data: { bedId: availableBed.id, patientId, notes: notes ? `[EMERGENCY SOS] ${notes}` : '[EMERGENCY SOS]' }
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

    const request = await prisma.bloodRequest.create({
      data: {
        patientId,
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
