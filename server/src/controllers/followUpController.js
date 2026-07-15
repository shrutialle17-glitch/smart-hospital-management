import { prisma } from "../index.js";

export const createFollowUp = async (req, res, next) => {
  try {
    const { patientId, description } = req.body;

    const followUp = await prisma.medicalRecord.create({
      data: {
        patientId,
        recordType: "FollowUp",
        description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Follow-up created successfully",
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowUps = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const followUps = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        recordType: "FollowUp",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const followUp = await prisma.medicalRecord.update({
      where: { id },
      data: { description },
    });

    res.status(200).json({
      success: true,
      message: "Follow-up updated successfully",
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.medicalRecord.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};