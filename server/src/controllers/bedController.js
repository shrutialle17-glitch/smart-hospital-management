import { prisma } from '../index.js';

// GET /api/v1/beds/wards — ward occupancy summary
export const getWards = async (req, res, next) => {
  try {
    const wards = await prisma.ward.findMany({  
      include: {
        beds: {
          select: { id: true, bedNumber: true, type: true, status: true, currentPatientId: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const wardsWithStats = wards.map(w => ({
      ...w,
      total: w.beds.length,
      available: w.beds.filter(b => b.status === 'AVAILABLE').length,
      occupied: w.beds.filter(b => b.status === 'OCCUPIED').length,
      reserved: w.beds.filter(b => b.status === 'RESERVED').length,
      cleaning: w.beds.filter(b => b.status === 'CLEANING').length,
    }));

    res.json({ success: true, data: wardsWithStats });
  } catch (err) { next(err); }
};

// GET /api/v1/beds — all beds with current patient info
export const getBeds = async (req, res, next) => {
  try {
    const { wardId, status, type } = req.query;
    const where = {};
    if (wardId) where.wardId = wardId;
    if (status) where.status = status;
    if (type) where.type = type;

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: { select: { id: true, name: true } },
        currentPatient: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: [{ wardId: 'asc' }, { bedNumber: 'asc' }]
    });

    res.json({ success: true, data: beds });
  } catch (err) { next(err); }
};

// POST /api/v1/beds — create a bed (ADMIN only)
export const createBed = async (req, res, next) => {
  try {
    const { wardId, bedNumber, type } = req.body;
    const bed = await prisma.bed.create({
      data: { wardId, bedNumber, type: type || 'GENERAL' },
      include: { ward: true }
    });
    res.status(201).json({ success: true, data: bed });
  } catch (err) { next(err); }
};

// PATCH /api/v1/beds/:id/assign — assign bed to patient
export const assignBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientId, notes } = req.body;

    const bed = await prisma.bed.findUnique({ where: { id } });
    if (!bed) return res.status(404).json({ success: false, error: { message: 'Bed not found' } });
    if (bed.status === 'OCCUPIED') return res.status(400).json({ success: false, error: { message: 'Bed is already occupied' } });

    const [updatedBed, assignment] = await prisma.$transaction([
      prisma.bed.update({
        where: { id },
        data: { status: 'OCCUPIED', currentPatientId: patientId },
        include: { ward: true, currentPatient: { include: { user: { select: { firstName: true, lastName: true } } } } }
      }),
      prisma.bedAssignment.create({
        data: { bedId: id, patientId, notes }
      })
    ]);

    res.json({ success: true, data: { bed: updatedBed, assignment } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/beds/:id/release — release bed → cleaning → available
export const releaseBed = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bed = await prisma.bed.findUnique({ where: { id } });
    if (!bed) return res.status(404).json({ success: false, error: { message: 'Bed not found' } });

    // Mark the active assignment as discharged
    await prisma.bedAssignment.updateMany({
      where: { bedId: id, dischargedAt: null },
      data: { dischargedAt: new Date() }
    });

    // Set bed to CLEANING (receptionist/admin marks available after cleaning)
    const updatedBed = await prisma.bed.update({
      where: { id },
      data: { status: 'CLEANING', currentPatientId: null },
      include: { ward: true }
    });

    res.json({ success: true, data: updatedBed });
  } catch (err) { next(err); }
};

// PATCH /api/v1/beds/:id/status — set arbitrary status (for AVAILABLE after cleaning)
export const updateBedStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bed = await prisma.bed.update({
      where: { id },
      data: { status },
      include: { ward: true }
    });
    res.json({ success: true, data: bed });
  } catch (err) { next(err); }
};
