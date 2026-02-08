import express from 'express';
import notificationService from '../services/notificationService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Test notification
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { channel } = req.body;
    
    const testLead = {
      companyName: 'Test Company Ltd.',
      urgency: 'medium',
      leadScore: { total: 75 },
      productRecommendations: [
        { product: 'HSD', productName: 'High Speed Diesel', confidence: 0.85 }
      ],
      nextAction: { action: 'Test notification' }
    };

    let result;
    if (channel === 'whatsapp') {
      result = await notificationService.sendWhatsApp(req.user.phone, testLead);
    } else if (channel === 'sms') {
      result = await notificationService.sendSMS(req.user.phone, testLead);
    } else if (channel === 'email') {
      result = await notificationService.sendEmail(req.user.email, testLead);
    } else {
      return res.status(400).json({ error: 'Invalid channel' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
