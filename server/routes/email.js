const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/"/g, '&quot;');
}

const EMAIL_TYPES = {
  invoice_overdue: {
    subject: 'Invoice Overdue - Action Required',
    template: 'invoice_overdue',
    description: 'Sent when an invoice becomes overdue',
  },
  invoice_paid: {
    subject: 'Payment Received - Invoice {{invoice_number}}',
    template: 'invoice_paid',
    description: 'Sent when an invoice is marked as paid',
  },
  project_update: {
    subject: 'Project Update - {{project_name}}',
    template: 'project_update',
    description: 'Sent on project status changes',
  },
  safety_alert: {
    subject: '⚠️ Safety Alert - Immediate Action Required',
    template: 'safety_alert',
    description: 'Sent for safety incidents and alerts',
  },
  rfi_response: {
    subject: 'RFI Response - {{rfi_number}}',
    template: 'rfi_response',
    description: 'Sent when an RFI receives a response',
  },
  meeting_reminder: {
    subject: 'Meeting Reminder - {{meeting_title}}',
    template: 'meeting_reminder',
    description: 'Sent 1 hour before meetings',
  },
  deadline_reminder: {
    subject: 'Deadline Approaching - {{deadline_title}}',
    template: 'deadline_reminder',
    description: 'Sent 24 hours before deadlines',
  },
  document_shared: {
    subject: 'Document Shared - {{document_name}}',
    template: 'document_shared',
    description: 'Sent when a document is shared',
  },
  team_assignment: {
    subject: 'Task Assigned - {{task_title}}',
    template: 'team_assignment',
    description: 'Sent when a task is assigned',
  },
  weekly_summary: {
    subject: 'Weekly Summary - {{company}}',
    template: 'weekly_summary',
    description: 'Sent every Monday with weekly overview',
  },
};

router.get('/templates', (req, res) => {
  res.json(EMAIL_TYPES);
});

router.get('/history', async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );
    const { rows: count } = await pool.query('SELECT COUNT(*) FROM email_logs');
    res.json({ emails: rows, total: parseInt(count[0].count, 10) });
  } catch (err) {
    console.error('[Email History]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { to, type, data, subject, body } = req.body;

    if (!to || !type) {
      return res.status(400).json({ message: 'to and type are required' });
    }

    const template = EMAIL_TYPES[type];
    if (!template) {
      return res.status(400).json({ message: 'Invalid email type' });
    }

    let emailSubject = subject || template.subject;
    let emailBody = body || generateEmailBody(type, data);

    Object.entries(data || {}).forEach(([key, value]) => {
      emailSubject = emailSubject.replace(`{{${key}}}`, String(value));
    });

    const { rows } = await pool.query(
      `INSERT INTO email_logs (recipient, subject, body, email_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [to, emailSubject, emailBody, type, 'sent', req.user?.id || 'system']
    );

    if (process.env.SMTP_HOST) {
      try {
        await sendEmailViaSMTP(to, emailSubject, emailBody);
        await pool.query(
          `UPDATE email_logs SET status = 'delivered' WHERE id = $1`,
          [rows[0].id]
        );
      } catch (smtpErr) {
        console.error('[SMTP Error]', smtpErr.message);
        await pool.query(
          `UPDATE email_logs SET status = 'failed', error = $1 WHERE id = $2`,
          [smtpErr.message, rows[0].id]
        );
      }
    }

    res.status(201).json({ success: true, email: rows[0] });
  } catch (err) {
    console.error('[Send Email]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { recipients, type, data, subject, body } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'recipients array is required' });
    }

    const template = EMAIL_TYPES[type] || { subject: subject || 'Bulk Email' };
    let emailSubject = subject || template.subject;

    Object.entries(data || {}).forEach(([key, value]) => {
      emailSubject = emailSubject.replace(`{{${key}}}`, String(value));
    });

    const results = [];
    for (const recipient of recipients) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO email_logs (recipient, subject, body, email_type, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [recipient, emailSubject, body || '', type || 'bulk', 'queued', req.user?.id || 'system']
        );
        results.push({ recipient, success: true, id: rows[0].id });
      } catch (err) {
        results.push({ recipient, success: false, error: err.message });
      }
    }

    res.status(201).json({ success: true, results });
  } catch (err) {
    console.error('[Bulk Email]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const { to, type, data, scheduledAt } = req.body;

    if (!to || !type || !scheduledAt) {
      return res.status(400).json({ message: 'to, type, and scheduledAt are required' });
    }

    const template = EMAIL_TYPES[type];
    let emailSubject = template?.subject || 'Scheduled Email';

    Object.entries(data || {}).forEach(([key, value]) => {
      emailSubject = emailSubject.replace(`{{${key}}}`, String(value));
    });

    const { rows } = await pool.query(
      `INSERT INTO scheduled_emails (recipient, subject, email_type, data, scheduled_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [to, emailSubject, type, JSON.stringify(data), scheduledAt, req.user?.id || 'system']
    );

    res.status(201).json({ success: true, scheduled: rows[0] });
  } catch (err) {
    console.error('[Schedule Email]', err.message);
    res.status(500).json({ message: err.message });
  }
});

function generateEmailBody(type, data) {
  const templates = {
    invoice_overdue: `
      <h2>Invoice Overdue</h2>
      <p>Invoice <strong>${escapeHtml(data?.invoice_number)}</strong> for <strong>${escapeHtml(data?.amount)}</strong> is overdue.</p>
      <p>Client: ${escapeHtml(data?.client)}</p>
      <p>Due Date: ${escapeHtml(data?.due_date)}</p>
      <p>Please take immediate action to collect payment.</p>
    `,
    invoice_paid: `
      <h2>Payment Received</h2>
      <p>Thank you! We have received payment for Invoice <strong>${escapeHtml(data?.invoice_number)}</strong>.</p>
      <p>Amount: <strong>${escapeHtml(data?.amount)}</strong></p>
      <p>Project: ${escapeHtml(data?.project)}</p>
    `,
    safety_alert: `
      <h2>⚠️ Safety Alert</h2>
      <p><strong>${escapeHtml(data?.title || 'Safety Incident')}</strong></p>
      <p>Type: ${escapeHtml(data?.type)}</p>
      <p>Severity: ${escapeHtml(data?.severity)}</p>
      <p>Location: ${escapeHtml(data?.location)}</p>
      <p>Immediate action is required.</p>
    `,
    meeting_reminder: `
      <h2>Meeting Reminder</h2>
      <p>You have a meeting coming up:</p>
      <p><strong>${escapeHtml(data?.meeting_title)}</strong></p>
      <p>Date: ${escapeHtml(data?.date)}</p>
      <p>Time: ${escapeHtml(data?.time)}</p>
      ${data?.link ? `<p>Join Link: <a href="${escapeAttr(data.link)}">${escapeAttr(data.link)}</a></p>` : ''}
    `,
    weekly_summary: `
      <h2>Weekly Summary</h2>
      <p>Here's your weekly overview for ${escapeHtml(data?.week || 'this week')}:</p>
      <ul>
        ${data?.projects_updated ? `<li>Projects Updated: ${escapeHtml(data.projects_updated)}</li>` : ''}
        ${data?.invoices_sent ? `<li>Invoices Sent: ${escapeHtml(data.invoices_sent)}</li>` : ''}
        ${data?.safety_incidents ? `<li>Safety Incidents: ${escapeHtml(data.safety_incidents)}</li>` : ''}
        ${data?.upcoming_deadlines ? `<li>Upcoming Deadlines: ${escapeHtml(data.upcoming_deadlines)}</li>` : ''}
      </ul>
    `,
  };

  return templates[type] || `<p>${escapeHtml(JSON.stringify(data || {}))}</p>`;
}

async function sendEmailViaSMTP(to, subject, body) {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@cortexbuild.co.uk',
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏗️ CortexBuild</h1>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p>This email was sent by CortexBuild Ultimate.</p>
            <p>© 2024 CortexBuild Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

module.exports = router;
