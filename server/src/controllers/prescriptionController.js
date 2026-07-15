import { prisma } from "../index.js";

export const createPrescription = async (req, res, next) => {
  try {
    const { patientId, notes, items } = req.body;

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

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId: doctor.id,
        notes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientPrescriptions = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Patient profile not found",
        },
      });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: {
          include: {
            medicine: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};