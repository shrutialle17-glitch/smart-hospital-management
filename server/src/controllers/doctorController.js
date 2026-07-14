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