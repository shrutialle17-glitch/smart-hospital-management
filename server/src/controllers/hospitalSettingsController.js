import { prisma } from '../index.js';

const DEFAULTS = {
  hospitalName: 'MediCore Smart Hospital',
  supportEmail: 'contact@medicore.com',
  emergencyPhone: '+1-800-MED-911',
  maxAppointmentsPerDoctor: '20',
};

// GET /api/v1/hospital-settings
export const getHospitalSettings = async (req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany();
    const settings = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// PUT /api/v1/hospital-settings
export const updateHospitalSettings = async (req, res, next) => {
  try {
    const { hospitalName, supportEmail, emergencyPhone, maxAppointmentsPerDoctor } = req.body;

    const entries = { hospitalName, supportEmail, emergencyPhone, maxAppointmentsPerDoctor };

    // Upsert each setting key
    await Promise.all(
      Object.entries(entries)
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) =>
          prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        )
    );

    const rows = await prisma.systemSetting.findMany();
    const settings = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;

    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};
