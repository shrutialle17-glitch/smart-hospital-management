import { prisma } from '../index.js';

// ---------------------------------------------------------
// Notification Channels
// ---------------------------------------------------------

class InAppChannel {
  async send(userId, payload) {
    const { title, message, type, relatedEntityType, relatedEntityId } = payload;
    
    // Writes to the DB for the Notification Center drawer
    await prisma.notification.create({
      data: {
        userId,
        title,
        message, // In Prisma schema, the body is stored in 'message'
        type,
        relatedEntityType,
        relatedEntityId,
        channelsSent: ['IN_APP']
      }
    });
  }
}

class EmailChannel {
  async send(userId, payload) {
    // Stub for Phase 1. Ready for SendGrid/SES integration later.
    // E.g., await sendgrid.send({...})
    console.log(`[EmailChannel Stub] Email simulated for User ${userId}: ${payload.title}`);
  }
}

class PushChannel {
  async send(userId, payload) {
    // Stub for FCM/APNs later.
    console.log(`[PushChannel Stub] Push notification simulated for User ${userId}: ${payload.title}`);
  }
}


// ---------------------------------------------------------
// Core Notification Service
// ---------------------------------------------------------

class NotificationService {
  constructor() {
    this.channels = {
      IN_APP: new InAppChannel(),
      EMAIL: new EmailChannel(),
      PUSH: new PushChannel()
    };
  }

  /**
   * Dispatches a notification through all configured channels.
   * @param {string} userId - Target user
   * @param {string} type - APPOINTMENT, LAB, PRESCRIPTION, BILLING, SYSTEM, VOICE_NOTE, CERTIFICATE
   * @param {object} payload - { title, message, relatedEntityType, relatedEntityId }
   */
  async send(userId, type, payload) {
    // Determine active channels from env (default to IN_APP)
    const activeChannelsStr = process.env.NOTIFICATION_CHANNELS || 'IN_APP';
    const activeChannels = activeChannelsStr.split(',').map(c => c.trim().toUpperCase());
    
    const augmentedPayload = { ...payload, type };
    const channelsSuccessfullySent = [];

    // Fan-out to each active channel
    for (const channelKey of activeChannels) {
      if (this.channels[channelKey]) {
        try {
          await this.channels[channelKey].send(userId, augmentedPayload);
          channelsSuccessfullySent.push(channelKey);
        } catch (error) {
          console.error(`Failed to send notification via ${channelKey}:`, error);
        }
      }
    }

    return channelsSuccessfullySent;
  }
}

export const notificationService = new NotificationService();
