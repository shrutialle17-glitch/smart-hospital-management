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

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Appointment not found",
        },
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};