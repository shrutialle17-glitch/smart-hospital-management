import { prisma } from "../index.js";

export const getPatientProfile = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        user: true,
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

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};