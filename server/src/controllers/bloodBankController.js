import { prisma } from '../index.js';

const SHELF_LIFE_DAYS = parseInt(process.env.BLOOD_SHELF_LIFE_DAYS || '42');

// GET /api/v1/blood-bank/inventory — stock by blood group with expiry info
export const getInventory = async (req, res, next) => {
  try {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7); // Expiring within 7 days

    const inventory = await prisma.bloodInventory.findMany({
      orderBy: [{ bloodGroup: 'asc' }, { expiresAt: 'asc' }]
    });

    // Aggregate by blood group with expiry flags
    const byGroup = {};
    const bloodGroups = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'];
    for (const bg of bloodGroups) {
      byGroup[bg] = { bloodGroup: bg, totalUnits: 0, batches: [], expiringSoon: 0, expired: 0 };
    }

    for (const item of inventory) {
      const bg = item.bloodGroup;
      const isExpired = new Date(item.expiresAt) < now;
      const isExpiringSoon = !isExpired && new Date(item.expiresAt) < warningDate;

      if (!isExpired) byGroup[bg].totalUnits += item.units;
      byGroup[bg].batches.push({ ...item, isExpired, isExpiringSoon });
      if (isExpiringSoon) byGroup[bg].expiringSoon += item.units;
      if (isExpired) byGroup[bg].expired += item.units;
    }

    res.json({ success: true, data: Object.values(byGroup), shelfLifeDays: SHELF_LIFE_DAYS });
  } catch (err) { next(err); }
};

// POST /api/v1/blood-bank/inventory — add blood units
export const addInventory = async (req, res, next) => {
  try {
    const { bloodGroup, units, location, notes } = req.body;
    const collectedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHELF_LIFE_DAYS);

    const item = await prisma.bloodInventory.create({
      data: { bloodGroup, units: parseInt(units), collectedAt, expiresAt, location, notes }
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
};

// GET /api/v1/blood-bank/donors
export const getDonors = async (req, res, next) => {
  try {
    const { bloodGroup } = req.query;
    const where = bloodGroup ? { bloodGroup } : {};
    const donors = await prisma.donor.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: donors });
  } catch (err) { next(err); }
};

// POST /api/v1/blood-bank/donors
export const createDonor = async (req, res, next) => {
  try {
    const { name, bloodGroup, phone, email, address, lastDonationDate } = req.body;
    const cooldownDays = 90;
    let isEligible = true;
    if (lastDonationDate) {
      const daysSince = (Date.now() - new Date(lastDonationDate)) / 86400000;
      isEligible = daysSince >= cooldownDays;
    }
    const donor = await prisma.donor.create({
      data: { name, bloodGroup, phone, email, address, lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null, isEligible }
    });
    res.status(201).json({ success: true, data: donor });
  } catch (err) { next(err); }
};

// GET /api/v1/blood-bank/requests
export const getBloodRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    // Role-based filter
    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (patient) where.patientId = patient.id;
    }

    const requests = await prisma.bloodRequest.findMany({
      where,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// POST /api/v1/blood-bank/requests
export const createBloodRequest = async (req, res, next) => {
  try {
    const { patientId, bloodGroup, units, urgency, department, notes } = req.body;
    const requestedById = req.user.id;

    const request = await prisma.bloodRequest.create({
      data: { patientId, requestedById, bloodGroup, units: parseInt(units), urgency: urgency || 'ROUTINE', department, notes }
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// PATCH /api/v1/blood-bank/requests/:id — approve/reject/fulfill
export const updateBloodRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (status === 'APPROVED') updateData.approvedAt = new Date();
    if (status === 'FULFILLED') updateData.fulfilledAt = new Date();

    const request = await prisma.bloodRequest.update({
      where: { id },
      data: updateData,
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};
