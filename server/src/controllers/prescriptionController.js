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