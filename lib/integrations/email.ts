// Email service using Resend
// Install resend: npm install resend

const resendApiKey = process.env.RESEND_API_KEY;

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || 'CortexBuild <noreply@cortexbuild.com>',
  replyTo,
  attachments,
}: SendEmailParams): Promise<{ id: string; success: boolean }> {
  if (!resendApiKey) {
    console.warn('Resend not configured, email not sent:', subject);
    return { id: '', success: false };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        replyTo,
        subject,
        html,
        text,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${error.message}`);
    }

    const data = await response.json();
    return { id: data.id || '', success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export { sendEmail };

export async function sendProjectInviteEmail(
  email: string,
  projectName: string,
  invitedBy: string,
  inviteLink: string
): Promise<{ id: string; success: boolean }> {
  return sendEmail({
    to: email,
    subject: `You've been invited to ${projectName}`,
    html: `
      <h1>You've been invited!</h1>
      <p>${invitedBy} has invited you to join the project "${projectName}" on CortexBuild.</p>
      <p><a href="${inviteLink}">Click here to accept the invitation</a></p>
      <p>This link will expire in 7 days.</p>
    `,
    text: `You've been invited to ${projectName} by ${invitedBy}. Visit ${inviteLink} to accept.`,
  });
}

export async function sendTaskAssignmentEmail(
  email: string,
  taskName: string,
  projectName: string,
  dueDate: string,
  assignedBy: string,
  taskLink: string
): Promise<{ id: string; success: boolean }> {
  return sendEmail({
    to: email,
    subject: `Task assigned: ${taskName}`,
    html: `
      <h1>New Task Assigned</h1>
      <p>${assignedBy} has assigned you a task in "${projectName}".</p>
      <ul>
        <li><strong>Task:</strong> ${taskName}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>
      <p><a href="${taskLink}">View Task</a></p>
    `,
    text: `You've been assigned task "${taskName}" in "${projectName}" by ${assignedBy}. Due: ${dueDate}. View at ${taskLink}`,
  });
}

export async function sendRFIEmail(
  email: string,
  rfiNumber: string,
  subject: string,
  projectName: string,
  submittedBy: string,
  rfiLink: string
): Promise<{ id: string; success: boolean }> {
  return sendEmail({
    to: email,
    subject: `RFI ${rfiNumber}: ${subject}`,
    html: `
      <h1>New RFI Submitted</h1>
      <p>${submittedBy} has submitted an RFI in "${projectName}".</p>
      <ul>
        <li><strong>RFI #:</strong> ${rfiNumber}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p><a href="${rfiLink}">View RFI</a></p>
    `,
    text: `New RFI ${rfiNumber}: ${subject} submitted by ${submittedBy} in "${projectName}". View at ${rfiLink}`,
  });
}

export async function sendSafetyIncidentAlert(
  emails: string[],
  incidentId: string,
  incidentType: string,
  location: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  reportedBy: string,
  incidentLink: string
): Promise<{ id: string; success: boolean }> {
  const severityColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };

  return sendEmail({
    to: emails,
    subject: `[${severity.toUpperCase()}] Safety Incident Reported: ${incidentType}`,
    html: `
      <h1 style="color: ${severityColors[severity]}">Safety Incident Alert</h1>
      <p>A new safety incident has been reported.</p>
      <ul>
        <li><strong>Incident Type:</strong> ${incidentType}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Severity:</strong> <span style="color: ${severityColors[severity]}">${severity.toUpperCase()}</span></li>
        <li><strong>Reported By:</strong> ${reportedBy}</li>
      </ul>
      <p><a href="${incidentLink}">View Incident Report</a></p>
    `,
    text: `SAFETY ALERT: ${incidentType} at ${location}. Severity: ${severity.toUpperCase()}. Reported by ${reportedBy}. View at ${incidentLink}`,
  });
}

export async function sendBudgetAlertEmail(
  email: string,
  projectName: string,
  budgetItem: string,
  planned: number,
  actual: number,
  variance: number,
  alertThreshold: number,
  projectLink: string
): Promise<{ id: string; success: boolean }> {
  const percentUsed = ((actual / planned) * 100).toFixed(1);
  const isOverBudget = variance < 0;

  return sendEmail({
    to: email,
    subject: `Budget Alert: ${projectName} - ${budgetItem}`,
    html: `
      <h1>Budget Alert</h1>
      <p>A budget item in "${projectName}" has exceeded the ${alertThreshold}% threshold.</p>
      <ul>
        <li><strong>Budget Item:</strong> ${budgetItem}</li>
        <li><strong>Planned:</strong> $${planned.toLocaleString()}</li>
        <li><strong>Actual:</strong> $${actual.toLocaleString()}</li>
        <li><strong>Variance:</strong> <span style="color: ${isOverBudget ? '#ef4444' : '#22c55e'}">$${variance.toLocaleString()}</span></li>
        <li><strong>% Used:</strong> ${percentUsed}%</li>
      </ul>
      <p><a href="${projectLink}">View Project Budget</a></p>
    `,
    text: `Budget Alert: ${budgetItem} in ${projectName} is at ${percentUsed}% of planned budget. Planned: $${planned.toLocaleString()}, Actual: $${actual.toLocaleString()}, Variance: $${variance.toLocaleString()}. View at ${projectLink}`,
  });
}

export async function sendDailyReportDigest(
  email: string,
  projectName: string,
  reportDate: string,
  summary: string,
  workPerformed: string[],
  link: string
): Promise<{ id: string; success: boolean }> {
  return sendEmail({
    to: email,
    subject: `Daily Report: ${projectName} - ${reportDate}`,
    html: `
      <h1>Daily Report Summary</h1>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Date:</strong> ${reportDate}</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <h2>Work Performed</h2>
      <ul>
        ${workPerformed.map((work) => `<li>${work}</li>`).join('')}
      </ul>
      <p><a href="${link}">View Full Report</a></p>
    `,
    text: `Daily Report for ${projectName} on ${reportDate}. ${summary}. Work: ${workPerformed.join(', ')}. View at ${link}`,
  });
}

export type { SendEmailParams };
