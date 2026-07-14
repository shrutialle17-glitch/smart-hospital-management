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

export const updatePatientProfile = async (req, res, next) => {
  try {
    const {
      phone,
      address,
      bloodGroup,
      emergencyContact,
      allergies,
      chronicConditions,
    } = req.body;

    // Update User table
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        phone,
      },
    });

    // Update Patient table
    const updatedPatient = await prisma.patient.update({
      where: {
        userId: req.user.id,
      },
      data: {
        address,
        bloodGroup,
        emergencyContact,
        allergies,
        chronicConditions,
      },
      include: {
        user: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      data: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};