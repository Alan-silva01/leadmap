
import { WebhookPayload } from '../types';

const WEBHOOK_URL = 'https://rapidus-n8n-webhook.b7bsm5.easypanel.host/webhook/busca_empresas';

export const triggerSearchWebhook = async (termo: string, cidade: string): Promise<boolean> => {
  try {
    // Formatting date to match exactly: 2026-01-21T09:54:48.213-03:00
    // Note: Since we are in JS, we use local offset for the -03:00 approximation or similar
    const now = new Date();
    const tzo = -now.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => num.toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    
    const submittedAt = now.getFullYear() +
      '-' + pad(now.getMonth() + 1) +
      '-' + pad(now.getDate()) +
      'T' + pad(now.getHours()) +
      ':' + pad(now.getMinutes()) +
      ':' + pad(now.getSeconds()) +
      '.' + ms +
      dif + pad(Math.floor(Math.abs(tzo) / 60)) +
      ':' + pad(Math.abs(tzo) % 60);

    const payload: WebhookPayload[] = [
      {
        "Termo da Busca": termo.toLowerCase(),
        "Cidade": cidade.toLowerCase(),
        "submittedAt": submittedAt,
        "formMode": "test"
      }
    ];

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook Error:', error);
    return false;
  }
};
