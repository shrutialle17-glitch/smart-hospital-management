import { prisma } from "../index.js";

export const getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        user: true,
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Doctor profile not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorProfile = async (req, res, next) => {
  try {
    const {
      phone,
      specialization,
      qualifications,
      experience,
      consultationFee,
      departmentId,
    } = req.body;

    // Update user phone
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        phone,
      },
    });

    // Update doctor profile
    const doctor = await prisma.doctor.update({
      where: {
        userId: req.user.id,
      },
      data: {
        specialization,
        qualifications,
        experience,
        consultationFee,
        departmentId,
      },
      include: {
        user: true,
        department: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Doctor not found",
        },
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorDashboard = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const totalPatients = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },
      distinct: ["patientId"],
    });

    const totalAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const pendingAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: "PENDING",
      },
    });

    const totalPrescriptions = await prisma.prescription.count({
      where: {
        doctorId: doctor.id,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients: totalPatients.length,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        totalPrescriptions,
      },
    });
  } catch (error) {
    next(error);
  }
};