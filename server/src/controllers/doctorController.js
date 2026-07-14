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