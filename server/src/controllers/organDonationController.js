import { prisma } from '../index.js';

// GET /api/v1/organ-donation/donors
export const getDonors = async (req, res, next) => {
  try {
    const donors = await prisma.organDonor.findMany({
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        registeredBy: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: donors });
  } catch (err) { next(err); }
};

// POST /api/v1/organ-donation/donors
export const createDonor = async (req, res, next) => {
  try {
    const { patientId, firstName, lastName, bloodGroup, organ, contactNumber } = req.body;
    const registeredById = req.user.id;

    const donor = await prisma.organDonor.create({
      data: {
        patientId,
        firstName,
        lastName,
        bloodGroup,
        organ,
        contactNumber,
        registeredById
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        registeredBy: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    res.status(201).json({ success: true, data: donor });
  } catch (err) { next(err); }
};

// GET /api/v1/organ-donation/recipients
export const getRecipients = async (req, res, next) => {
  try {
    const recipients = await prisma.organRecipient.findMany({
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        registeredBy: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: recipients });
  } catch (err) { next(err); }
};

// POST /api/v1/organ-donation/recipients
export const createRecipient = async (req, res, next) => {
  try {
    const { patientId, firstName, lastName, bloodGroup, organ, urgency, contactNumber } = req.body;
    const registeredById = req.user.id;

    const recipient = await prisma.organRecipient.create({
      data: {
        patientId,
        firstName,
        lastName,
        bloodGroup,
        organ,
        urgency: urgency || 'NORMAL',
        contactNumber,
        registeredById
      },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        registeredBy: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    res.status(201).json({ success: true, data: recipient });
  } catch (err) { next(err); }
};

// GET /api/v1/organ-donation/matches
export const getMatches = async (req, res, next) => {
  try {
    const matches = await prisma.organMatch.findMany({
      include: {
        donor: true,
        recipient: true,
        approver: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: matches });
  } catch (err) { next(err); }
};

// POST /api/v1/organ-donation/matches
export const createMatch = async (req, res, next) => {
  try {
    const { donorId, recipientId, notes } = req.body;

    // Check if donor and recipient exist
    const donor = await prisma.organDonor.findUnique({ where: { id: donorId } });
    const recipient = await prisma.organRecipient.findUnique({ where: { id: recipientId } });

    if (!donor || !recipient) {
      return res.status(404).json({ success: false, error: { message: 'Donor or Recipient not found' } });
    }

    const match = await prisma.organMatch.create({
      data: {
        donorId,
        recipientId,
        notes
      },
      include: { donor: true, recipient: true }
    });

    res.status(201).json({ success: true, data: match });
  } catch (err) { next(err); }
};

// PATCH /api/v1/organ-donation/matches/:id
export const updateMatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const approverId = req.user.id; // Only Admin should hit this route

    const match = await prisma.organMatch.update({
      where: { id },
      data: {
        status,
        notes,
        approverId
      },
      include: {
        donor: true,
        recipient: true,
        approver: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    // Sync donor and recipient status based on match status
    if (status === 'APPROVED') {
      await prisma.organDonor.update({ where: { id: match.donorId }, data: { status: 'MATCHED' } });
      await prisma.organRecipient.update({ where: { id: match.recipientId }, data: { status: 'APPROVED' } });
    } else if (status === 'COMPLETED') {
      await prisma.organDonor.update({ where: { id: match.donorId }, data: { status: 'MATCHED' } });
      await prisma.organRecipient.update({ where: { id: match.recipientId }, data: { status: 'COMPLETED' } });
    } else if (status === 'REJECTED') {
      await prisma.organDonor.update({ where: { id: match.donorId }, data: { status: 'PENDING' } });
      await prisma.organRecipient.update({ where: { id: match.recipientId }, data: { status: 'UNDER_REVIEW' } });
    }

    res.json({ success: true, data: match });
  } catch (err) { next(err); }
};
