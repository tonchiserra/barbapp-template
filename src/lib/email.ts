import { Resend } from "resend";
import type { EmailSettings } from "@/types";
import { DEFAULT_EMAIL_SETTINGS } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

interface CompletionEmailParams {
  to: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  emailSettings?: EmailSettings;
}

function replaceVars(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

export async function sendCompletionEmail({
  to,
  clientName,
  serviceName,
  staffName,
  date,
  startTime,
  emailSettings,
}: CompletionEmailParams) {
  const settings = emailSettings ?? DEFAULT_EMAIL_SETTINGS;

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const formattedTime = startTime.slice(0, 5);

  const vars: Record<string, string> = {
    nombre: clientName,
    servicio: serviceName,
    profesional: staffName,
    fecha: formattedDate,
    hora: formattedTime,
  };

  const subject = replaceVars(settings.subject, vars);
  const greeting = replaceVars(settings.greeting, vars);
  const body = replaceVars(settings.body, vars);
  const farewell = replaceVars(settings.farewell, vars);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">
        ${greeting}
      </h2>
      ${body ? `<p style="color: #666; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">${body}</p>` : ""}
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px;">
          <strong>Servicio:</strong> ${serviceName}
        </p>
        ${staffName ? `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Profesional:</strong> ${staffName}</p>` : ""}
        <p style="margin: 0 0 8px; font-size: 14px;">
          <strong>Fecha:</strong> ${formattedDate}
        </p>
        <p style="margin: 0; font-size: 14px;">
          <strong>Hora:</strong> ${formattedTime} hs
        </p>
      </div>
      ${farewell ? `<p style="color: #999; font-size: 13px; margin: 0;">${farewell}</p>` : ""}
    </div>
  `;

  await resend.emails.send({
    from: "Barbapp <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
