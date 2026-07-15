import { prisma } from '../index.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { role, search } = req.query;
    const loggedInUser = req.user;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Security: If logged-in user is a DOCTOR, they can ONLY see their own patients
    if (loggedInUser.role === 'DOCTOR' && role === 'PATIENT') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: loggedInUser.id } });
      if (doctor) {
        where.patientProfile = {
          is: {
            appointments: {
              some: {
                doctorId: doctor.id
              }
            }
          }
        };
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          patientProfile: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        doctorProfile: {
          include: { department: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
        doctorProfile: { include: { department: true } },
        receptionistProfile: true,
        patientProfile: true,
        labStaffProfile: true,
        pharmacistProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'isActive must be a boolean' }
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      data: user,
      message: `User status updated to ${isActive ? 'active' : 'inactive'}`
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    
    // Quick validation
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: { message: "All fields are required" }});
    }

    const existingUser = await prisma.user.findUnique({ where: { email }});
    if (existingUser) {
      return res.status(400).json({ success: false, error: { message: "Email already exists" }});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileData = {};
    if (role === 'DOCTOR') {
      // Find or create a default department
      let dept = await prisma.department.findFirst();
      if (!dept) {
        dept = await prisma.department.create({ data: { name: 'General Medicine', description: 'General' } });
      }
      profileData = {
        doctorProfile: {
          create: {
            departmentId: dept.id,
            specialization: 'General',
            qualifications: 'MBBS',
            experience: 5,
            consultationFee: 500
          }
        }
      };
    } else if (role === 'RECEPTIONIST') {
      profileData = { receptionistProfile: { create: {} } };
    } else if (role === 'PHARMACIST') {
      profileData = { pharmacistProfile: { create: {} } };
    } else if (role === 'LAB_STAFF') {
      profileData = { labStaffProfile: { create: {} } };
    }

    const profileImage = req.file ? req.file.path : null;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        firstName,
        lastName,
        phone,
        profileImage,
        ...profileData
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    next(error);
  }
};
