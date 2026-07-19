import { prisma } from '../index.js';

export const createVoiceNote = async (req, res, next) => {
  try {
    const { consultationId } = req.body;
    
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, error: { message: 'Audio file is required.' } });
    }

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(403).json({ success: false, error: { message: 'Only registered doctors can upload voice notes.' } });
    }

    const voiceNote = await prisma.voiceNote.create({
      data: {
        doctorId: doctor.id,
        consultationId: consultationId || null,
        url: req.file.path,
        duration: Math.round(req.file.duration || 0)
      }
    });

    res.status(201).json({ success: true, data: voiceNote });
  } catch (error) {
    next(error);
  }
};

export const getVoiceNotes = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(403).json({ success: false, error: { message: 'Only registered doctors can view their voice notes.' } });
    }

    const voiceNotes = await prisma.voiceNote.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: voiceNotes });
  } catch (error) {
    next(error);
  }
};
