import { prisma } from '../index.js';

const ROLLING_AVERAGE_SAMPLE_SIZE = 10;
const DEFAULT_WAIT_MINUTES = 15;

// Compute rolling average consultation duration in minutes for a doctor
async function getRollingAverage(doctorId) {
  const completed = await prisma.queueToken.findMany({
    where: {
      doctorId,
      status: 'COMPLETED',
      calledAt: { not: null },
      consultationEndedAt: { not: null }
    },
    orderBy: { consultationEndedAt: 'desc' },
    take: ROLLING_AVERAGE_SAMPLE_SIZE,
    select: { calledAt: true, consultationEndedAt: true }
  });

  if (completed.length < 3) return DEFAULT_WAIT_MINUTES;

  const totalMinutes = completed.reduce((sum, t) => {
    const durationMs = new Date(t.consultationEndedAt) - new Date(t.calledAt);
    return sum + durationMs / 60000;
  }, 0);

  return Math.round(totalMinutes / completed.length);
}

// GET /api/v1/queue — all queues overview for reception/admin
export const getAllQueues = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doctors = await prisma.doctor.findMany({
      include: { user: { select: { firstName: true, lastName: true } }, department: true }
    });

    const queues = await Promise.all(doctors.map(async (doc) => {
      const tokens = await prisma.queueToken.findMany({
        where: { doctorId: doc.id, date: { gte: today, lt: tomorrow } },
        include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
        orderBy: { tokenNumber: 'asc' }
      });

      const avgMinutes = await getRollingAverage(doc.id);
      const waitingTokens = tokens.filter(t => t.status === 'WAITING');
      const nowServing = tokens.find(t => t.status === 'IN_CONSULTATION' || t.status === 'CALLED');

      return {
        doctorId: doc.id,
        doctorName: `Dr. ${doc.user.firstName} ${doc.user.lastName}`,
        department: doc.department?.name,
        tokens,
        nowServing: nowServing || null,
        tokensWaiting: waitingTokens.length,
        avgConsultationMinutes: avgMinutes,
        estimatedWaitMinutes: avgMinutes * waitingTokens.length,
      };
    }));

    res.json({ success: true, data: queues.filter(q => q.tokens.length > 0) });
  } catch (err) { next(err); }
};

// GET /api/v1/queue/doctor/:id — doctor's own queue with wait estimates
export const getDoctorQueue = async (req, res, next) => {
  try {
    const { id } = req.params; // doctorId
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tokens = await prisma.queueToken.findMany({
      where: { doctorId: id, date: { gte: today, lt: tomorrow } },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
      orderBy: { tokenNumber: 'asc' }
    });

    const avgMinutes = await getRollingAverage(id);
    const waitingTokens = tokens.filter(t => t.status === 'WAITING');

    const tokensWithWait = tokens.map((t) => {
      const positionInWaiting = waitingTokens.findIndex(w => w.id === t.id);
      return {
        ...t,
        estimatedWaitMinutes: t.status === 'WAITING' && positionInWaiting >= 0
          ? avgMinutes * (positionInWaiting + 1)
          : null
      };
    });

    res.json({
      success: true,
      data: {
        tokens: tokensWithWait,
        avgConsultationMinutes: avgMinutes,
        nowServing: tokens.find(t => t.status === 'IN_CONSULTATION' || t.status === 'CALLED') || null,
        tokensWaiting: waitingTokens.length
      }
    });
  } catch (err) { next(err); }
};

// GET /api/v1/queue/patient — patient's own queue token
export const getPatientQueueToken = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, error: { message: 'Patient profile not found' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const token = await prisma.queueToken.findFirst({
      where: {
        patientId: patient.id,
        date: { gte: today, lt: tomorrow },
        status: { notIn: ['COMPLETED', 'SKIPPED'] }
      },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } }
      }
    });

    if (!token) return res.json({ success: true, data: null });

    // Count tokens ahead
    const tokensAhead = await prisma.queueToken.count({
      where: {
        doctorId: token.doctorId,
        date: { gte: today, lt: tomorrow },
        status: 'WAITING',
        tokenNumber: { lt: token.tokenNumber }
      }
    });

    const avgMinutes = await getRollingAverage(token.doctorId);

    res.json({
      success: true,
      data: {
        ...token,
        tokensAhead,
        estimatedWaitMinutes: token.status === 'WAITING' ? avgMinutes * (tokensAhead + 1) : 0
      }
    });
  } catch (err) { next(err); }
};

// POST /api/v1/queue/check-in — issue a token (RECEPTIONIST)
export const checkIn = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get next token number for this doctor today
    const lastToken = await prisma.queueToken.findFirst({
      where: { doctorId, date: { gte: today, lt: tomorrow } },
      orderBy: { tokenNumber: 'desc' }
    });

    const tokenNumber = (lastToken?.tokenNumber || 0) + 1;

    const data = { patientId, doctorId, tokenNumber };
    if (appointmentId) data.appointmentId = appointmentId;

    const token = await prisma.queueToken.create({
      data,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    const avgMinutes = await getRollingAverage(doctorId);
    const tokensAhead = tokenNumber - 1;

    res.status(201).json({
      success: true,
      data: { ...token, estimatedWaitMinutes: avgMinutes * (tokensAhead + 1) }
    });
  } catch (err) { next(err); }
};

// PATCH /api/v1/queue/:id/call — doctor calls next patient
export const callToken = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Mark any current IN_CONSULTATION token as completed first for this doctor
    const token = await prisma.queueToken.findUnique({ where: { id } });
    if (!token) return res.status(404).json({ success: false, error: { message: 'Token not found' } });

    const updated = await prisma.queueToken.update({
      where: { id },
      data: { status: 'IN_CONSULTATION', calledAt: new Date() },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// PATCH /api/v1/queue/:id/complete — doctor marks consultation done
export const completeToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const updated = await prisma.queueToken.update({
      where: { id },
      data: { status: 'COMPLETED', consultationEndedAt: now },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } }
    });

    // Recompute rolling average after completion (returned for display)
    const avgMinutes = await getRollingAverage(updated.doctorId);

    res.json({ success: true, data: { ...updated, updatedAvgMinutes: avgMinutes } });
  } catch (err) { next(err); }
};

// PATCH /api/v1/queue/:id/skip — skip a token
export const skipToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.queueToken.update({
      where: { id },
      data: { status: 'SKIPPED' }
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};
