import { prisma } from '../index.js';

/**
 * Shared service for Medicine Intelligence and Pharmacy Analytics
 * Encapsulates the aggregation logic so controllers stay thin.
 */

const SHELF_LIFE_DAYS = parseInt(process.env.BLOOD_SHELF_LIFE_DAYS || '42'); // Reused concept for config passing if needed

export const getPharmacyAnalytics = async () => {
  const [totalMedicines, categoriesCount, totalRevenueResult] = await Promise.all([
    prisma.medicine.count(),
    prisma.medicineCategory.count(),
    prisma.billItem.aggregate({
      where: { type: 'MEDICINE' },
      _sum: { amount: true }
    })
  ]);

  const medicines = await prisma.medicine.findMany({
    include: { category: true }
  });

  let lowStockCount = 0;
  const stockByLevel = { good: 0, low: 0, out: 0 };
  
  medicines.forEach(m => {
    if (m.stockLevel === 0) stockByLevel.out++;
    else if (m.stockLevel <= (m.minStock || 10)) {
      stockByLevel.low++;
      lowStockCount++;
    }
    else stockByLevel.good++;
  });

  return {
    overview: {
      totalMedicines,
      categoriesCount,
      lowStockCount,
      totalRevenue: totalRevenueResult._sum.amount || 0
    },
    stockHealth: stockByLevel,
    // Top 5 lowest stock medicines
    actionableAlerts: medicines
      .filter(m => m.stockLevel <= (m.minStock || 10))
      .sort((a, b) => a.stockLevel - b.stockLevel)
      .slice(0, 5)
  };
};

export const getMedicineIntelligence = async () => {
  // Simulates AI-driven or advanced analytics for the pharmacist
  // e.g., identifying prescribing trends from BillItems or Prescriptions
  
  // Get the most frequently prescribed/billed medicines
  const popularMedicines = await prisma.billItem.groupBy({
    by: ['description'],
    where: { type: 'MEDICINE' },
    _count: { description: true },
    orderBy: { _count: { description: 'desc' } },
    take: 5
  });

  const analytics = await getPharmacyAnalytics();

  return {
    prescribingTrends: popularMedicines.map(m => ({
      name: m.description,
      prescriptionCount: m._count.description
    })),
    stockAlerts: analytics.actionableAlerts,
    restockRecommendations: analytics.actionableAlerts.map(m => ({
      medicineId: m.id,
      name: m.name,
      currentStock: m.stockLevel,
      recommendedOrder: (m.minStock || 10) * 3 // Recommend ordering 3x min stock
    }))
  };
};
