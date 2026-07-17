import { prisma } from '../index.js';
import { getMedicineIntelligence } from '../services/pharmacyAnalyticsService.js';

export const getMedicines = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { categoryId, search, lowStock } = req.query;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    
    // Low stock filter logic
    if (lowStock === 'true') {
      where.stockLevel = { lte: prisma.medicine.fields.minStock }; 
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.medicine.count({ where })
    ]);

    // If lowStock is true, filter them manually if field ref wasn't used or just return the list.
    let finalMedicines = medicines;
    if (lowStock === 'true') {
      finalMedicines = medicines.filter(m => m.stockLevel <= m.minStock);
    }

    res.status(200).json({
      success: true,
      data: finalMedicines,
      meta: { page, limit, total: lowStock === 'true' ? finalMedicines.length : total }
    });
  } catch (error) {
    next(error);
  }
};

export const addMedicine = async (req, res, next) => {
  try {
    const { name, categoryId, manufacturer, unitPrice, stockLevel, minStock, expiryDate } = req.body;

    if (!name || !categoryId || !unitPrice) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    const medicine = await prisma.medicine.create({
      data: {
        name,
        categoryId,
        manufacturer,
        unitPrice: parseFloat(unitPrice),
        stockLevel: parseInt(stockLevel) || 0,
        minStock: parseInt(minStock) || 10,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      }
    });

    if (medicine.stockLevel > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          medicineId: medicine.id,
          transactionType: 'IN',
          quantity: medicine.stockLevel,
          unitPrice: medicine.unitPrice,
          notes: 'Initial stock'
        }
      });
    }

    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, transactionType, notes } = req.body;

    if (!quantity || !transactionType) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'quantity and transactionType are required' } });
    }

    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Medicine not found' } });
    }

    let newStockLevel = medicine.stockLevel;
    if (transactionType === 'IN') {
      newStockLevel += parseInt(quantity);
    } else if (transactionType === 'OUT') {
      if (newStockLevel < parseInt(quantity)) {
        return res.status(400).json({ success: false, error: { code: 'STOCK_ERROR', message: `Insufficient stock for ${medicine.name}. Please restock first.` } });
      }
      newStockLevel -= parseInt(quantity);
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: { stockLevel: newStockLevel }
    });

    await prisma.inventoryTransaction.create({
      data: {
        medicineId: id,
        transactionType,
        quantity: parseInt(quantity),
        notes
      }
    });

    res.status(200).json({ success: true, data: updatedMedicine });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      where.patientId = patient?.id;
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        items: { include: { medicine: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const { patientId, doctorId, notes, items } = req.body;
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        notes,
        items: {
          create: items.map(item => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration
          }))
        }
      }
    });
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

export const updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.medicineCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getIntelligence = async (req, res, next) => {
  try {
    const data = await getMedicineIntelligence();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
