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
  for (let i = 1; i <= 10; i++) {
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
    patients.push(patUser.patientProfile);
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
        isRead: i % 3 === 0
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
