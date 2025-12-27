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
    <h2>Rappel de Tâche de Maintenance</h2>
    <p>Bonjour,</p>
    <p>La tâche de maintenance suivante est <strong>en retard de ${daysOverdue} jour(s)</strong> :</p>
    <p><strong>${taskTitle}</strong></p>
    <p>Veuillez effectuer cette tâche dès que possible.</p>
    <p>Cordialement,<br>Équipe de Maintenance</p>
  `;

  const textContent = `
    Rappel de Tâche de Maintenance
    
    La tâche de maintenance suivante est en retard de ${daysOverdue} jour(s) :
    ${taskTitle}
    
    Veuillez effectuer cette tâche dès que possible.
    
    Cordialement,
    Équipe de Maintenance
  `;

  return sendEmail({
    subject: `[EN RETARD] Tâche de Maintenance : ${taskTitle}`,
    htmlContent,
    textContent,
  });
}
