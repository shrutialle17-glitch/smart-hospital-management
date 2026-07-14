import { prisma } from '../index.js';

export const getBills = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, patientId } = req.query;

    const where = {};
    if (status) where.status = status;

    // RBAC
    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      where.patientId = patient?.id;
    } else if (patientId) {
      where.patientId = patientId;
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bill.count({ where })
    ]);

    res.status(200).json({ success: true, data: bills, meta: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createBill = async (req, res, next) => {
  try {
    const { patientId, items, dueDate } = req.body;
    if (!patientId || !items || items.length === 0) {
       return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'patientId and items are required' } });
    }

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) * (parseInt(item.quantity) || 1)), 0);

    const bill = await prisma.bill.create({
      data: {
        patientId,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
            quantity: parseInt(item.quantity) || 1,
            type: item.type,
            medicineId: item.medicineId
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount and payment method are required' } });
    }

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Bill not found' } });

    const newPaidAmount = bill.paidAmount + parseFloat(amount);
    let newStatus = 'PARTIAL';
    if (newPaidAmount >= bill.totalAmount) {
      newStatus = 'PAID';
    }

    const [payment, updatedBill] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          billId: id,
          amount: parseFloat(amount),
          paymentMethod,
          transactionId
        }
      }),
      prisma.bill.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      })
    ]);

    res.status(200).json({ success: true, data: { payment, bill: updatedBill } });
  } catch (error) {
    next(error);
  }
};
