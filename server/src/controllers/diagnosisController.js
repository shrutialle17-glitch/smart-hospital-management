import { prisma } from "../index.js";

export const createDiagnosis = async (req, res, next) => {
  try {
    const { patientId, description } = req.body;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        recordType: "Diagnosis",
        description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Diagnosis added successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getDiagnosis = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        recordType: "Diagnosis",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiagnosis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: { description },
    });

    res.status(200).json({
      success: true,
      message: "Diagnosis updated successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDiagnosis = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.medicalRecord.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Diagnosis deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};