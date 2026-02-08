import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

/**
 * Notification service for WhatsApp, SMS, and Email
 */
class NotificationService {
  constructor() {
    // Twilio for WhatsApp and SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
      this.twilioSmsNumber = process.env.TWILIO_SMS_NUMBER;
    }

    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send WhatsApp notification
   * NOTE: Requires WhatsApp Business API approval and message templates
   */
  async sendWhatsApp(to, lead) {
    if (!this.twilioClient || !this.twilioWhatsAppNumber) {
      logger.warn('WhatsApp not configured, skipping notification');
      return { success: false, reason: 'not_configured' };
    }

    try {
      // Format phone number for WhatsApp (must include country code)
      const formattedNumber = to.startsWith('+') ? to : `+91${to}`;
      
      // WhatsApp message template (must be pre-approved)
      const message = this.formatWhatsAppMessage(lead);

      const result = await this.twilioClient.messages.create({
        from: `whatsapp:${this.twilioWhatsAppNumber}`,
        to: `whatsapp:${formattedNumber}`,
        body: message
      });

      logger.info(`WhatsApp sent to ${formattedNumber}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error('WhatsApp notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to, lead) {
    if (!this.twilioClient || !this.twilioSmsNumber) {
      logger.warn('SMS not configured, skipping notification');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const formattedNumber = to.startsWith('+') ? to : `+91${to}`;
      const message = this.formatSMSMessage(lead);

      const result = await this.twilioClient.messages.create({
        from: this.twilioSmsNumber,
        to: formattedNumber,
        body: message
      });

      logger.info(`SMS sent to ${formattedNumber}: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error('SMS notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, lead) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@hpcl-leads.com',
        to: to,
        subject: `New Lead: ${lead.companyName} - ${lead.urgency.toUpperCase()} Priority`,
        html: this.formatEmailHTML(lead),
        text: this.formatEmailText(lead)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification based on user preferences
   */
  async sendNotification(user, lead) {
    const results = {
      whatsapp: null,
      sms: null,
      email: null
    };

    // Send WhatsApp if opted in and enabled
    if (user.notificationPreferences.whatsapp && user.whatsappOptIn && user.phone) {
      results.whatsapp = await this.sendWhatsApp(user.phone, lead);
    }

    // Send SMS if enabled
    if (user.notificationPreferences.sms && user.phone) {
      results.sms = await this.sendSMS(user.phone, lead);
    }

    // Send Email if enabled
    if (user.notificationPreferences.email && user.email) {
      results.email = await this.sendEmail(user.email, lead);
    }

    return results;
  }

  /**
   * Format WhatsApp message (must comply with approved template)
   */
  formatWhatsAppMessage(lead) {
    const products = lead.productRecommendations
      .slice(0, 3)
      .map(p => `${p.product} (${Math.round(p.confidence * 100)}%)`)
      .join(', ');

    return `🔔 *New Lead Alert*

*Company:* ${lead.companyName}
*Priority:* ${lead.urgency.toUpperCase()}
*Score:* ${Math.round(lead.leadScore.total)}/100

*Recommended Products:*
${products}

*Action:* ${lead.nextAction?.action || 'Contact and qualify'}

View full details in the HPCL Lead Intelligence app.`;
  }

  /**
   * Format SMS message
   */
  formatSMSMessage(lead) {
    return `New Lead: ${lead.companyName} (${lead.urgency.toUpperCase()}). Score: ${Math.round(lead.leadScore.total)}. Products: ${lead.productRecommendations[0]?.product}. Check app for details.`;
  }

  /**
   * Format email text
   */
  formatEmailText(lead) {
    const products = lead.productRecommendations
      .map(p => `- ${p.product} (${p.productName}): ${Math.round(p.confidence * 100)}% confidence\n  Reason: ${p.reasonCodes.join(', ')}`)
      .join('\n');

    return `New Lead Discovered

Company: ${lead.companyName}
Industry: ${lead.companyDetails?.industry || 'N/A'}
Priority: ${lead.urgency.toUpperCase()}
Lead Score: ${Math.round(lead.leadScore.total)}/100

Product Recommendations:
${products}

Signals:
${lead.signals.map(s => `- ${s.sourceType}: ${s.source} (${new Date(s.timestamp).toLocaleDateString()})`).join('\n')}

Next Action: ${lead.nextAction?.action || 'Contact and qualify the lead'}

Location: ${lead.companyDetails?.address || 'N/A'}

View full lead dossier in the HPCL Lead Intelligence application.`;
  }

  /**
   * Format email HTML
   */
  formatEmailHTML(lead) {
    const products = lead.productRecommendations
      .map(p => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${p.product} - ${p.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${Math.round(p.confidence * 100)}%</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">${p.reasonCodes.join(', ')}</td>
        </tr>
      `)
      .join('');

    const urgencyColor = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f'
    }[lead.urgency];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🔔 New Lead Alert</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin-top: 0; color: #667eea;">${lead.companyName}</h2>
      <p><strong>Industry:</strong> ${lead.companyDetails?.industry || 'N/A'}</p>
      <p><strong>Location:</strong> ${lead.companyDetails?.address || 'N/A'}</p>
      
      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <div style="flex: 1; background: ${urgencyColor}; color: white; padding: 10px; border-radius: 4px; text-align: center;">
          <div style="font-size: 12px;">Priority</div>
          <div style="font-size: 18px; font-weight: bold;">${lead.urgency.toUpperCase()}</div>
        </div>
        <div style="flex: 1; background: #667eea; color: white; padding: 10px; border-radius: 4px; text-align: center;">
          <div style="font-size: 12px;">Lead Score</div>
          <div style="font-size: 18px; font-weight: bold;">${Math.round(lead.leadScore.total)}/100</div>
        </div>
      </div>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #667eea;">Recommended Products</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #667eea;">Product</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #667eea;">Confidence</th>
            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #667eea;">Reason</th>
          </tr>
        </thead>
        <tbody>
          ${products}
        </tbody>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #667eea;">Next Action</h3>
      <p style="font-size: 16px; margin: 0;">${lead.nextAction?.action || 'Contact and qualify the lead'}</p>
    </div>

    <div style="text-align: center; padding: 20px;">
      <a href="${process.env.FRONTEND_URL}/leads/${lead._id}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">View Full Dossier</a>
    </div>

    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
      <p>HPCL Lead Intelligence System | Powered by AI</p>
    </div>
  </div>
</body>
</html>`;
  }
}

export default new NotificationService();
