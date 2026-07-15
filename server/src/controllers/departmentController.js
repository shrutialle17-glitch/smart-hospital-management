import { prisma } from '../index.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { doctors: true }
        }
      }
    });

    const formatted = departments.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      head: d.headName || 'Unassigned',
      count: d._count.doctors
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, headName, description } = req.body;
    const department = await prisma.department.create({
      data: { name, headName, description }
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, headName } = req.body;
    const department = await prisma.department.update({
      where: { id },
      data: { name, headName }
    });
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};
