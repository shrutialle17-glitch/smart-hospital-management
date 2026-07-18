import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import "dotenv/config";
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed process...');

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // 1. Create Admin
  console.log('Seeding admin...');
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@novacare.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@novacare.com',
        passwordHash: defaultPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        adminProfile: { create: {} }
      }
    });
  }

  // 2. Create Departments
  console.log('Seeding departments...');
  const deptNames = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'];
  const departments = [];
  for (const name of deptNames) {
    let dept = await prisma.department.findUnique({ where: { name } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name, description: `${name} Department` } });
    }
    departments.push(dept);
  }

  // 3. Create Doctors (5)
  console.log('Seeding doctors...');
  const doctors = [];
  for (let i = 1; i <= 5; i++) {
    const email = `doctor${i}@novacare.com`;
    let docUser = await prisma.user.findUnique({ where: { email } });
    if (!docUser) {
      docUser = await prisma.user.create({
        data: {
          email,
          passwordHash: defaultPassword,
          firstName: 'Doctor',
          lastName: `Smith ${i}`,
          role: 'DOCTOR',
          doctorProfile: {
            create: {
              departmentId: departments[i % departments.length].id,
              specialization: 'General',
              qualifications: 'MD, MBBS',
              experience: 5 + i,
              consultationFee: 100 + (i * 10)
            }
          }
        },
        include: { doctorProfile: true }
      });
    } else {
      docUser = await prisma.user.findUnique({ where: { email }, include: { doctorProfile: true } });
    }
    doctors.push(docUser.doctorProfile);
  }

  // 4. Create Staff (3 Receptionists, 2 Lab Staff, 2 Pharmacists)
  console.log('Seeding staff...');
  for (let i = 1; i <= 3; i++) {
    const email = `receptionist${i}@novacare.com`;
    if (!await prisma.user.findUnique({ where: { email } })) {
      await prisma.user.create({ data: { email, passwordHash: defaultPassword, firstName: 'Rec', lastName: `${i}`, role: 'RECEPTIONIST', receptionistProfile: { create: {} } } });
    }
  }
  for (let i = 1; i <= 2; i++) {
    const email = `lab${i}@novacare.com`;
    if (!await prisma.user.findUnique({ where: { email } })) {
      await prisma.user.create({ data: { email, passwordHash: defaultPassword, firstName: 'Lab', lastName: `${i}`, role: 'LAB_STAFF', labStaffProfile: { create: {} } } });
    }
  }
  for (let i = 1; i <= 2; i++) {
    const email = `pharmacy${i}@novacare.com`;
    if (!await prisma.user.findUnique({ where: { email } })) {
      await prisma.user.create({ data: { email, passwordHash: defaultPassword, firstName: 'Pharm', lastName: `${i}`, role: 'PHARMACIST', pharmacistProfile: { create: {} } } });
    }
  }

  // 5. Create Patients (20)
  console.log('Seeding patients...');
  const patients = [];
  for (let i = 1; i <= 20; i++) {
    const email = `patient${i}@novacare.com`;
    let patUser = await prisma.user.findUnique({ where: { email } });
    if (!patUser) {
      patUser = await prisma.user.create({
        data: {
          email,
          passwordHash: defaultPassword,
          firstName: 'John',
          lastName: `Doe ${i}`,
          phone: `123456789${i%10}`,
          role: 'PATIENT',
          patientProfile: {
            create: {
              dob: new Date('1990-01-01'),
              gender: i % 2 === 0 ? 'Male' : 'Female',
              bloodGroup: 'O_POS'
            }
          }
        },
        include: { patientProfile: true }
      });
    } else {
      patUser = await prisma.user.findUnique({ where: { email }, include: { patientProfile: true } });
    }
    patients.push({ ...patUser.patientProfile, user: patUser });
  }

  // 6. Create Medicine Categories (4+)
  console.log('Seeding pharmacy...');
  const catNames = ['Antibiotics', 'Painkillers', 'Vitamins', 'Syrups', 'Injections'];
  const categories = [];
  for (const name of catNames) {
    let cat = await prisma.medicineCategory.findUnique({ where: { name } });
    if (!cat) {
      cat = await prisma.medicineCategory.create({ data: { name } });
    }
    categories.push(cat);
  }

  // 7. Create Medicines (20) - Some low stock
  const medicines = [];
  for (let i = 1; i <= 20; i++) {
    const name = `Medication ${i}`;
    let med = await prisma.medicine.findFirst({ where: { name } });
    if (!med) {
      med = await prisma.medicine.create({
        data: {
          name,
          categoryId: categories[i % categories.length].id,
          manufacturer: 'PharmaCorp',
          unitPrice: 10.5 + i,
          stockLevel: i < 5 ? 2 : 50, // First 4 will be low stock (minStock defaults to 10)
        }
      });
    }
    medicines.push(med);
  }

  // 8. Create Appointments (30)
  console.log('Seeding appointments & medical records...');
  for (let i = 1; i <= 30; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    
    // Check if we already have 30 appointments
    const count = await prisma.appointment.count();
    if (count >= 30) break;

    const date = new Date();
    date.setDate(date.getDate() + (i % 10)); // spread across next 10 days
    date.setHours(9 + (i % 8), 0, 0, 0); // between 9 AM and 5 PM
    
    const startTime = new Date(date);
    const endTime = new Date(date);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const status = statuses[i % statuses.length];

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        startTime,
        endTime,
        status,
        reason: 'Routine checkup'
      }
    });

    if (status === 'COMPLETED') {
      await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          recordType: 'Consultation',
          description: `Patient visited for routine checkup. Everything looks normal.`
        }
      });
      
      // Seed prescriptions for completed ones
      if (i % 2 === 0) {
        await prisma.prescription.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            notes: 'Take medicine after meals',
            items: {
              create: [
                {
                  medicineId: medicines[0].id,
                  dosage: '500mg',
                  frequency: 'Twice a day',
                  duration: '5 days'
                }
              ]
            }
          }
        });
      }
    }
  }

  // 9. Bills and Notifications
  console.log('Seeding bills and notifications...');
  for (let i = 1; i <= 20; i++) {
    const bCount = await prisma.bill.count();
    if (bCount >= 20) break;

    const patient = patients[i % patients.length];
    await prisma.bill.create({
      data: {
        patientId: patient.id,
        totalAmount: 150.0,
        status: i % 2 === 0 ? 'PAID' : 'UNPAID',
        items: {
          create: [
            { description: 'Consultation Fee', amount: 100.0, type: 'CONSULTATION' },
            { description: 'Medicine', amount: 50.0, type: 'MEDICINE' }
          ]
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'Welcome to NovaCare',
        message: 'Your profile has been created successfully.',
        type: 'SYSTEM',
        isRead: i % 3 === 0,
        channelsSent: ['IN_APP']
      }
    });
  }

  // ── Phase 3 Seed Data ──────────────────────────────────────

  // 10. Wards
  console.log('Seeding wards...');
  const wardData = [
    { name: 'ICU Ward', description: 'Intensive Care Unit — critical patients' },
    { name: 'General Ward A', description: 'General admission — male patients' },
    { name: 'General Ward B', description: 'General admission — female patients' },
    { name: 'Private Wing', description: 'Private rooms for premium care' },
  ];
  const wards = [];
  for (const w of wardData) {
    let ward = await prisma.ward.findUnique({ where: { name: w.name } });
    if (!ward) ward = await prisma.ward.create({ data: w });
    wards.push(ward);
  }

  // 11. Beds
  console.log('Seeding beds...');
  const bedConfigs = [
    // ICU Ward — 5 beds
    { wardIdx: 0, type: 'ICU', count: 5 },
    // General Ward A — 8 beds
    { wardIdx: 1, type: 'GENERAL', count: 8 },
    // General Ward B — 5 beds
    { wardIdx: 2, type: 'GENERAL', count: 5 },
    // Private Wing — 3 beds
    { wardIdx: 3, type: 'PRIVATE', count: 3 },
  ];
  const bedStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'];
  for (const cfg of bedConfigs) {
    const ward = wards[cfg.wardIdx];
    for (let i = 1; i <= cfg.count; i++) {
      const bedNumber = `${ward.name.split(' ')[0][0]}${i}`;
      const exists = await prisma.bed.findUnique({ where: { wardId_bedNumber: { wardId: ward.id, bedNumber } } });
      if (!exists) {
        await prisma.bed.create({
          data: {
            wardId: ward.id,
            bedNumber,
            type: cfg.type,
            status: bedStatuses[(i + cfg.wardIdx) % bedStatuses.length],
          }
        });
      }
    }
  }

  // 12. Ambulances
  console.log('Seeding ambulances...');
  const ambulanceData = [
    { vehicleNumber: 'MH-01-AB-1234', driverName: 'Ravi Kumar', driverPhone: '9876543210', model: 'Tata Winger', status: 'AVAILABLE' },
    { vehicleNumber: 'MH-01-AB-5678', driverName: 'Suresh Patil', driverPhone: '9876543211', model: 'Force Traveller', status: 'EN_ROUTE' },
    { vehicleNumber: 'MH-01-AB-9012', driverName: 'Arjun Sharma', driverPhone: '9876543212', model: 'Toyota Hiace', status: 'AVAILABLE' },
  ];
  const ambulances = [];
  for (const a of ambulanceData) {
    let amb = await prisma.ambulance.findUnique({ where: { vehicleNumber: a.vehicleNumber } });
    if (!amb) amb = await prisma.ambulance.create({ data: a });
    ambulances.push(amb);
  }

  // 13. Ambulance Requests
  console.log('Seeding ambulance requests...');
  const ambReqCount = await prisma.ambulanceRequest.count();
  if (ambReqCount < 5) {
    const ambReqData = [
      { ambulanceId: ambulances[1].id, patientId: patients[0].id, requestedById: patients[0].userId, pickupAddress: '12 MG Road, Mumbai', priority: 'CRITICAL', status: 'EN_ROUTE' },
      { ambulanceId: ambulances[0].id, patientId: patients[1].id, requestedById: patients[1].userId, pickupAddress: '45 Andheri East, Mumbai', priority: 'HIGH', status: 'DISPATCHED' },
      { patientId: patients[2].id, requestedById: patients[2].userId, pickupAddress: '78 Bandra West, Mumbai', priority: 'NORMAL', status: 'REQUESTED' },
      { ambulanceId: ambulances[0].id, patientId: patients[3].id, requestedById: patients[3].userId, pickupAddress: '23 Juhu Beach Road, Mumbai', priority: 'HIGH', status: 'COMPLETED', completedAt: new Date() },
      { patientId: patients[4].id, requestedById: patients[4].userId, pickupAddress: '5 Colaba Causeway, Mumbai', priority: 'NORMAL', status: 'REQUESTED' },
    ];
    for (const req of ambReqData) {
      await prisma.ambulanceRequest.create({ data: req });
    }
  }

  // 14. Blood Inventory
  console.log('Seeding blood inventory...');
  const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
  const bloodInvCount = await prisma.bloodInventory.count();
  if (bloodInvCount < 8) {
    const shelfDays = parseInt(process.env.BLOOD_SHELF_LIFE_DAYS || '42');
    for (let i = 0; i < bloodGroups.length; i++) {
      const bg = bloodGroups[i];
      const units = i < 2 ? 2 : (i < 5 ? 10 : 20); // A_NEG and A_POS critically low
      const collectedDaysAgo = i < 3 ? 35 : 5; // A/B types near expiry
      const collectedAt = new Date();
      collectedAt.setDate(collectedAt.getDate() - collectedDaysAgo);
      const expiresAt = new Date(collectedAt);
      expiresAt.setDate(expiresAt.getDate() + shelfDays);
      await prisma.bloodInventory.create({
        data: { bloodGroup: bg, units, collectedAt, expiresAt, location: `Shelf ${String.fromCharCode(65 + i)}-1` }
      });
    }
  }

  // 15. Donors
  console.log('Seeding donors...');
  const donorCount = await prisma.donor.count();
  if (donorCount < 8) {
    const donorData = [
      { name: 'Aarav Singh', bloodGroup: 'O_POS', phone: '9000000001', lastDonationDate: new Date(Date.now() - 100 * 86400000), isEligible: true },
      { name: 'Priya Nair', bloodGroup: 'A_POS', phone: '9000000002', lastDonationDate: new Date(Date.now() - 50 * 86400000), isEligible: false }, // donated 50 days ago, not eligible
      { name: 'Rahul Mehta', bloodGroup: 'B_NEG', phone: '9000000003', lastDonationDate: null, isEligible: true },
      { name: 'Sneha Kapoor', bloodGroup: 'AB_POS', phone: '9000000004', lastDonationDate: new Date(Date.now() - 95 * 86400000), isEligible: true },
      { name: 'Vikram Desai', bloodGroup: 'O_NEG', phone: '9000000005', lastDonationDate: new Date(Date.now() - 120 * 86400000), isEligible: true },
      { name: 'Ananya Joshi', bloodGroup: 'A_NEG', phone: '9000000006', lastDonationDate: null, isEligible: true },
      { name: 'Karan Malhotra', bloodGroup: 'B_POS', phone: '9000000007', lastDonationDate: new Date(Date.now() - 30 * 86400000), isEligible: false },
      { name: 'Deepa Iyer', bloodGroup: 'AB_NEG', phone: '9000000008', lastDonationDate: new Date(Date.now() - 200 * 86400000), isEligible: true },
    ];
    for (const d of donorData) {
      await prisma.donor.create({ data: d });
    }
  }

  // 16. Blood Requests
  console.log('Seeding blood requests...');
  const bloodReqCount = await prisma.bloodRequest.count();
  if (bloodReqCount < 4) {
    const bloodReqData = [
      { patientId: patients[0].id, requestedById: patients[0].userId, bloodGroup: 'O_POS', units: 2, urgency: 'CRITICAL', status: 'PENDING', department: 'Emergency' },
      { patientId: patients[1].id, requestedById: patients[1].userId, bloodGroup: 'A_POS', units: 1, urgency: 'URGENT', status: 'APPROVED', department: 'Surgery', approvedAt: new Date() },
      { patientId: patients[2].id, requestedById: patients[2].userId, bloodGroup: 'B_POS', units: 3, urgency: 'ROUTINE', status: 'FULFILLED', department: 'General', approvedAt: new Date(), fulfilledAt: new Date() },
      { requestedById: patients[3].userId, bloodGroup: 'AB_NEG', units: 1, urgency: 'URGENT', status: 'PENDING', department: 'ICU' },
    ];
    for (const req of bloodReqData) {
      await prisma.bloodRequest.create({ data: req });
    }
  }

  // 17. Queue Tokens (with realistic consultation durations for rolling average)
  console.log('Seeding queue tokens...');
  const qTokenCount = await prisma.queueToken.count();
  if (qTokenCount < 10) {
    const now = new Date();
    const tokenData = [
      // Completed tokens for doctor 0 — provides rolling average data
      { doctorId: doctors[0].id, patientId: patients[0].id, tokenNumber: 1, status: 'COMPLETED', calledAt: new Date(now - 90*60000), consultationEndedAt: new Date(now - 75*60000) }, // 15 min
      { doctorId: doctors[0].id, patientId: patients[1].id, tokenNumber: 2, status: 'COMPLETED', calledAt: new Date(now - 70*60000), consultationEndedAt: new Date(now - 58*60000) }, // 12 min
      { doctorId: doctors[0].id, patientId: patients[2].id, tokenNumber: 3, status: 'COMPLETED', calledAt: new Date(now - 50*60000), consultationEndedAt: new Date(now - 36*60000) }, // 14 min
      // In-consultation token for doctor 0
      { doctorId: doctors[0].id, patientId: patients[3].id, tokenNumber: 4, status: 'IN_CONSULTATION', calledAt: new Date(now - 10*60000) },
      // Waiting tokens for doctor 0
      { doctorId: doctors[0].id, patientId: patients[4].id, tokenNumber: 5, status: 'WAITING' },
      { doctorId: doctors[0].id, patientId: patients[5].id, tokenNumber: 6, status: 'WAITING' },
      // Completed for doctor 1
      { doctorId: doctors[1].id, patientId: patients[6].id, tokenNumber: 1, status: 'COMPLETED', calledAt: new Date(now - 60*60000), consultationEndedAt: new Date(now - 42*60000) }, // 18 min
      { doctorId: doctors[1].id, patientId: patients[7].id, tokenNumber: 2, status: 'COMPLETED', calledAt: new Date(now - 38*60000), consultationEndedAt: new Date(now - 20*60000) }, // 18 min
      // Waiting for doctor 1
      { doctorId: doctors[1].id, patientId: patients[8].id, tokenNumber: 3, status: 'WAITING' },
      { doctorId: doctors[1].id, patientId: patients[9].id, tokenNumber: 4, status: 'WAITING' },
    ];
    for (const t of tokenData) {
      await prisma.queueToken.create({ data: t });
    }
  }

  // 18. Organ Donation Registry
  console.log('Seeding organ donation registry...');
  const donorCount18 = await prisma.organDonor.count();
  if (donorCount18 === 0) {
    const adminUser18 = await prisma.user.findUnique({ where: { email: 'admin@novacare.com' } });
    
    // Create 3 Donors
    const d1 = await prisma.organDonor.create({
      data: {
        patientId: patients[5].id,
        firstName: patients[5].user.firstName,
        lastName: patients[5].user.lastName,
        bloodGroup: 'O_POS',
        organ: 'Kidney',
        contactNumber: '9988776655',
        status: 'PENDING',
        registeredById: adminUser18.id
      }
    });
    const d2 = await prisma.organDonor.create({
      data: {
        patientId: patients[6].id,
        firstName: patients[6].user.firstName,
        lastName: patients[6].user.lastName,
        bloodGroup: 'A_NEG',
        organ: 'Liver',
        contactNumber: '9988776656',
        status: 'APPROVED',
        registeredById: adminUser18.id
      }
    });
    const d3 = await prisma.organDonor.create({
      data: {
        patientId: patients[7].id,
        firstName: patients[7].user.firstName,
        lastName: patients[7].user.lastName,
        bloodGroup: 'B_POS',
        organ: 'Heart',
        contactNumber: '9988776657',
        status: 'MATCHED',
        registeredById: adminUser18.id
      }
    });

    // Create 3 Recipients
    const r1 = await prisma.organRecipient.create({
      data: {
        patientId: patients[8].id,
        firstName: patients[8].user.firstName,
        lastName: patients[8].user.lastName,
        bloodGroup: 'O_POS',
        organ: 'Kidney',
        urgency: 'CRITICAL',
        contactNumber: '9988776658',
        status: 'PENDING',
        registeredById: adminUser18.id
      }
    });
    const r2 = await prisma.organRecipient.create({
      data: {
        patientId: patients[9].id,
        firstName: patients[9].user.firstName,
        lastName: patients[9].user.lastName,
        bloodGroup: 'B_POS',
        organ: 'Heart',
        urgency: 'CRITICAL',
        contactNumber: '9988776659',
        status: 'APPROVED',
        registeredById: adminUser18.id
      }
    });

    // Create 1 Match
    await prisma.organMatch.create({
      data: {
        donorId: d3.id,
        recipientId: r2.id,
        status: 'PENDING',
        notes: 'HLH matched. Awaiting final board approval.'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
