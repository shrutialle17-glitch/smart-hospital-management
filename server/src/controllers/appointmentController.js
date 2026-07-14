import { prisma } from "../index.js";

export const bookAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      date,
      startTime,
      endTime,
      reason,
      notes,
    } = req.body;

    // Find logged-in patient
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PATIENT_NOT_FOUND",
          message: "Patient profile not found",
        },
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason,
        notes,
      },
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};