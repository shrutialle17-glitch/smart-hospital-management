import { prisma } from '../index.js';

export const getAllAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, doctorId, patientId, date } = req.query;

    const where = {};
    if (status) where.status = status;
    
    // Role-based filtering
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      where.doctorId = doctor?.id;
    } else if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      where.patientId = patient?.id;
    } else {
      if (doctorId) where.doctorId = doctorId;
      if (patientId) where.patientId = patientId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }),
      prisma.appointment.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: appointments,
      meta: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, startTime, endTime, reason } = req.body;
    let { patientId } = req.body;

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = patient?.id;
    }

    if (!doctorId || !patientId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    // Check for conflicting appointments
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT_ERROR', message: 'Doctor is already booked for this time slot' }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason
      },
      include: { doctor: true, patient: true }
    });

    // Generate Notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.doctor.userId,
          title: 'New Appointment Booked',
          message: `You have a new appointment scheduled for ${new Date(date).toLocaleDateString()}.`,
          type: 'APPOINTMENT'
        },
        {
          userId: appointment.patient.userId,
          title: 'Appointment Booked',
          message: `Your appointment has been successfully booked for ${new Date(date).toLocaleDateString()}.`,
          type: 'APPOINTMENT'
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Status is required' }
      });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status' }
      });
    }

    // Security: Patients can only CANCEL their OWN appointments
    if (req.user.role === 'PATIENT') {
      if (status !== 'CANCELLED') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Patients can only cancel appointments' }
        });
      }
      
      const existingAppt = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true }
      });
      
      if (existingAppt.patient.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not own this appointment' }
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status, notes },
      include: { patient: true }
    });

    // Notify patient of status change
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        title: 'Appointment Update',
        message: `Your appointment status has been updated to ${status}.`,
        type: 'APPOINTMENT'
      }
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' }
      });
    }
    next(error);
  }
};
