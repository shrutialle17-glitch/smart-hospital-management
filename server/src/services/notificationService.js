import { prisma } from '../index.js';

/**
 * Notification Service
 * Centralised helper to create notifications from any controller.
 * Usage:
 *   import { notify, notifyMany, notifyAdmins } from '../services/notificationService.js';
 *   await notify(userId, 'Appointment Confirmed', 'Your appointment is confirmed for ...', 'APPOINTMENT');
 */

// ──────────────────────────────────────────────
// Core: Send a notification to a single user
// ──────────────────────────────────────────────
export const notify = async (userId, title, message, type = 'SYSTEM') => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type, // APPOINTMENT | LAB | PRESCRIPTION | BILLING | SYSTEM
      },
    });
    return notification;
  } catch (error) {
    // Log but don't throw — notifications should never break the main flow
    console.error('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
};

// ──────────────────────────────────────────────
// Bulk: Send the same notification to many users
// ──────────────────────────────────────────────
export const notifyMany = async (userIds, title, message, type = 'SYSTEM') => {
  try {
    if (!userIds || userIds.length === 0) return [];

    const data = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
    }));

    const result = await prisma.notification.createMany({ data });
    return result;
  } catch (error) {
    console.error('[NotificationService] Failed to create bulk notifications:', error.message);
    return null;
  }
};

// ──────────────────────────────────────────────
// Convenience: Notify all admins
// ──────────────────────────────────────────────
export const notifyAdmins = async (title, message, type = 'SYSTEM') => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return null;

    return await notifyMany(
      admins.map((a) => a.id),
      title,
      message,
      type
    );
  } catch (error) {
    console.error('[NotificationService] Failed to notify admins:', error.message);
    return null;
  }
};

// ──────────────────────────────────────────────
// Convenience: Notify by role
// ──────────────────────────────────────────────
export const notifyByRole = async (role, title, message, type = 'SYSTEM') => {
  try {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) return null;

    return await notifyMany(
      users.map((u) => u.id),
      title,
      message,
      type
    );
  } catch (error) {
    console.error(`[NotificationService] Failed to notify role ${role}:`, error.message);
    return null;
  }
};

// ──────────────────────────────────────────────
// Pre-built event helpers
// ──────────────────────────────────────────────

export const notifyAppointmentBooked = async (patientUserId, doctorUserId, dateTime) => {
  const formattedDate = new Date(dateTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Notify patient
  await notify(
    patientUserId,
    'Appointment Booked',
    `Your appointment has been scheduled for ${formattedDate}.`,
    'APPOINTMENT'
  );

  // Notify doctor
  await notify(
    doctorUserId,
    'New Appointment',
    `A new appointment has been booked for ${formattedDate}.`,
    'APPOINTMENT'
  );
};

export const notifyAppointmentCancelled = async (patientUserId, doctorUserId, reason) => {
  const msg = reason ? `Reason: ${reason}` : 'No reason provided.';

  await notify(patientUserId, 'Appointment Cancelled', `Your appointment was cancelled. ${msg}`, 'APPOINTMENT');
  await notify(doctorUserId, 'Appointment Cancelled', `An appointment was cancelled. ${msg}`, 'APPOINTMENT');
};

export const notifyLabReportReady = async (patientUserId, testName) => {
  await notify(
    patientUserId,
    'Lab Report Ready',
    `Your ${testName} lab report is now available. View it in your medical records.`,
    'LAB'
  );
};

export const notifyPrescriptionCreated = async (patientUserId, doctorName) => {
  await notify(
    patientUserId,
    'New Prescription',
    `Dr. ${doctorName} has written a new prescription for you.`,
    'PRESCRIPTION'
  );
};

export const notifyBillGenerated = async (patientUserId, amount) => {
  await notify(
    patientUserId,
    'New Bill Generated',
    `A new bill of ₹${Number(amount).toFixed(2)} has been generated. Please check your billing section.`,
    'BILLING'
  );
};

export const notifyPaymentReceived = async (patientUserId, amount) => {
  await notify(
    patientUserId,
    'Payment Received',
    `Your payment of ₹${Number(amount).toFixed(2)} has been recorded successfully. Thank you!`,
    'BILLING'
  );
};
