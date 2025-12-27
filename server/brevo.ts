import * as SibApiV3Sdk from '@getbrevo/brevo';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API key
const apiKey = process.env.BREVO_API_KEY || '';
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);

export interface EmailOptions {
  to?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_RECIPIENT_EMAIL) {
      console.warn('Brevo API key or recipient email not configured');
      return false;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: process.env.BREVO_RECIPIENT_EMAIL }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.htmlContent;
    if (options.textContent) {
      sendSmtpEmail.textContent = options.textContent;
    }
    sendSmtpEmail.sender = {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@example.com',
      name: process.env.BREVO_FROM_NAME || 'Maintenance Reminder',
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendOverdueTaskReminder(
  email: string,
  taskTitle: string,
  daysOverdue: number
): Promise<boolean> {
  const htmlContent = `
    <h2>Maintenance Task Reminder</h2>
    <p>Hello,</p>
    <p>The following maintenance task is <strong>${daysOverdue} day(s) overdue</strong>:</p>
    <p><strong>${taskTitle}</strong></p>
    <p>Please complete this task as soon as possible.</p>
    <p>Best regards,<br>Maintenance Team</p>
  `;

  const textContent = `
    Maintenance Task Reminder
    
    The following maintenance task is ${daysOverdue} day(s) overdue:
    ${taskTitle}
    
    Please complete this task as soon as possible.
    
    Best regards,
    Maintenance Team
  `;

  return sendEmail({
    subject: `[OVERDUE] Maintenance Task: ${taskTitle}`,
    htmlContent,
    textContent,
  });
}
