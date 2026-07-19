import { prisma } from '../index.js';

// GET /api/v1/ambulance — list all ambulances
export const getAmbulances = async (req, res, next) => {
  try {
    const ambulances = await prisma.ambulance.findMany({
      include: {
        requests: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { vehicleNumber: 'asc' }
    });
    res.json({ success: true, data: ambulances });
  } catch (err) { next(err); }
};

// GET /api/v1/ambulance/requests — all ambulance requests
export const getAmbulanceRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await prisma.ambulanceRequest.findMany({
      where,
      include: {
        ambulance: { select: { vehicleNumber: true, driverName: true, driverPhone: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// POST /api/v1/ambulance/requests — create a new ambulance request
export const createAmbulanceRequest = async (req, res, next) => {
  try {
    const { patientId, pickupAddress, priority, ambulanceId, notes, destination } = req.body;
    const requestedById = req.user.id;

    const data = {
      requestedById,
      pickupAddress,
      priority: priority || 'NORMAL',
      notes,
      destination: destination || 'NovaCare Hospital',
    };
    if (patientId) data.patientId = patientId;
    if (ambulanceId) {
      data.ambulanceId = ambulanceId;
      data.status = 'DISPATCHED';
      data.dispatchedAt = new Date();
      // Update ambulance status
      await prisma.ambulance.update({ where: { id: ambulanceId }, data: { status: 'DISPATCHED' } });
    }

    const request = await prisma.ambulanceRequest.create({
      data,
      include: {
        ambulance: true,
        patient: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// PATCH /api/v1/ambulance/requests/:id — update request status
export const updateAmbulanceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, ambulanceId } = req.body;

    const updateData = { status };
    if (status === 'DISPATCHED') { updateData.dispatchedAt = new Date(); }
    if (status === 'ARRIVED') { updateData.arrivedAt = new Date(); }
    if (status === 'COMPLETED') { updateData.completedAt = new Date(); }
    if (ambulanceId) {
      updateData.ambulanceId = ambulanceId;
      // Sync ambulance status
      await prisma.ambulance.update({ where: { id: ambulanceId }, data: { status } });
    }

    const request = await prisma.ambulanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        ambulance: true,
        patient: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};
