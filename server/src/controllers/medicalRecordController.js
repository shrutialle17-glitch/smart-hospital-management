import { prisma } from "../index.js";

// Add Medical Record
export const addMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, recordType, description, fileUrl } = req.body;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        recordType,
        description,
        fileUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: "Medical record added successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// Get Patient Medical History
export const getMedicalHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId,
      },
      orderBy: {
        date: "desc",
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

// Update Medical Record
export const updateMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recordType, description, fileUrl } = req.body;

    const record = await prisma.medicalRecord.update({
      where: {
        id,
      },
      data: {
        recordType,
        description,
        fileUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Medical Record
export const deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.medicalRecord.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Medical record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};