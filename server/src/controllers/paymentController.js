import { prisma } from '../index.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { notificationService } from '../services/notificationService.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'dummy_secret',
});

// 1. Create Order (Checkout init)
export const createOrder = async (req, res, next) => {
  try {
    const { amount, currency = "INR", billId } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: { message: "Amount is required" } });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt: billId ? `rcpt_${billId.substring(0, 30)}` : `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Payment Signature
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: { message: "Missing Razorpay response parameters" } });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || 'dummy_secret')
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: { message: "Payment verification failed: Signature mismatch" } });
    }

    // Payment is verified
    let updatedBill = null;
    let newPayment = null;

    if (billId) {
      // Find the bill
      const bill = await prisma.bill.findUnique({ where: { id: billId } });
      
      if (bill) {
        // Fetch payment details from Razorpay to get the exact amount captured
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        const amountPaid = paymentDetails.amount / 100;

        const newPaidAmount = bill.paidAmount + amountPaid;
        let newStatus = 'PARTIAL';
        if (newPaidAmount >= bill.totalAmount) {
          newStatus = 'PAID';
        }

        // Sequential database updates to prevent transaction pool exhaustion
        const paymentRec = await prisma.payment.create({
          data: {
            billId,
            amount: amountPaid,
            paymentMethod: 'ONLINE',
            transactionId: razorpay_payment_id
          }
        });

        const billUpdate = await prisma.bill.update({
          where: { id: billId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus
          },
          include: { patient: true }
        });

        newPayment = paymentRec;
        updatedBill = billUpdate;

        // Send Notification
        await notificationService.send(updatedBill.patient.userId, 'BILLING', {
          title: 'Payment Received',
          message: `Your payment of ₹${amountPaid} for Bill #${billId.substring(0,6).toUpperCase()} was successful.`,
          relatedEntityType: 'BILL',
          relatedEntityId: billId
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        bill: updatedBill,
        paymentRecord: newPayment
      }
    });

  } catch (error) {
    next(error);
  }
};
