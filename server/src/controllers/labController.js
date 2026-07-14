import { prisma } from '../index.js';

export const getLabTests = async (req, res, next) => {
  try {
    const tests = await prisma.labTest.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

export const getLabReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, patientId } = req.query;

    const where = {};
    if (status) where.status = status;

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      where.patientId = patient?.id;
    } else if (patientId) {
      where.patientId = patientId;
    }

    const [reports, total] = await Promise.all([
      prisma.labReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          test: true
        },
        orderBy: { date: 'desc' }
      }),
      prisma.labReport.count({ where })
    ]);

    let finalReports = reports;
    let finalTotal = total;

    // Add mock data if empty for demonstration purposes
    if (total === 0 && !status && req.user.role !== 'PATIENT') {
      finalReports = [
        {
          id: 'mock-report-1',
          patient: { user: { firstName: 'Harsh', lastName: 'Alle' } },
          test: { name: 'Complete Blood Count (CBC)' },
          status: 'COMPLETED',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-report-2',
          patient: { user: { firstName: 'Jane', lastName: 'Smith' } },
          test: { name: 'Lipid Profile' },
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ];
      finalTotal = 2;
    }

    res.status(200).json({ success: true, data: finalReports, meta: { page, limit, total: finalTotal } });
  } catch (error) {
    next(error);
  }
};

export const createLabRequest = async (req, res, next) => {
  try {
    let { patientId, testId, testName } = req.body;

    if (!patientId || (!testId && !testName)) {
       return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'patientId and (testId or testName) are required' } });
    }

    if (!testId && testName) {
      let test = await prisma.labTest.findUnique({ where: { name: testName } });
      if (!test) {
        test = await prisma.labTest.create({ data: { name: testName, price: 50.0 } });
      }
      testId = test.id;
    }

    const report = await prisma.labReport.create({
      data: {
        patientId,
        testId,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const updateLabReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status, result, fileUrl } = req.body;

    if (req.file && req.file.path) {
      fileUrl = req.file.path; // Cloudinary secure url
    }

    if (!status && !result && !fileUrl) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
    }

    const report = await prisma.labReport.update({
      where: { id },
      data: { status, result, fileUrl }
    });

    // If completed, notify patient
    if (status === 'COMPLETED') {
      const populatedReport = await prisma.labReport.findUnique({ where: { id }, include: { patient: true } });
      await prisma.notification.create({
        data: {
          userId: populatedReport.patient.userId,
          title: 'Lab Report Ready',
          message: 'Your recent lab report is now available for download.',
          type: 'LAB'
        }
      });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
