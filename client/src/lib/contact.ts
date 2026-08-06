import { z } from 'zod';
import emailjs from '@emailjs/browser';

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(80, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Escribe un correo electrónico válido.').max(160),
  project: z.string().trim().min(3, 'Describe brevemente el tipo de proyecto.').max(120, 'El tipo de proyecto es demasiado largo.'),
  message: z.string().trim().min(20, 'El mensaje debe tener al menos 20 caracteres.').max(2000, 'El mensaje no puede superar 2000 caracteres.'),
  website: z.string().max(0, 'No se pudo validar el formulario.').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export function firstContactError(error: z.ZodError<ContactFormData>): string {
  return error.issues[0]?.message ?? 'Revisa los datos del formulario.';
}

export interface ContactEmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

type EmailTransport = (
  serviceId: string,
  templateId: string,
  templateParams: Record<string, string>,
  publicKey: string
) => Promise<unknown>;

export async function sendContactMessage(
  data: ContactFormData,
  config: ContactEmailConfig,
  options: { timeoutMs?: number; transport?: EmailTransport } = {}
): Promise<void> {
  if (!config.serviceId || !config.templateId || !config.publicKey) {
    throw new Error('Contact email configuration is missing');
  }

  const transport = options.transport ?? emailjs.send.bind(emailjs);
  const timeoutMs = options.timeoutMs ?? 15000;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      transport(
        config.serviceId,
        config.templateId,
        {
          // La plantilla activa usa `name`/`email` en sus cabeceras y
          // `from_name`/`from_email` en el contenido. Enviamos ambos pares
          // para mantenerlos sincronizados y evitar valores sin resolver.
          name: data.name,
          email: data.email,
          from_name: data.name,
          from_email: data.email,
          reply_to: data.email,
          project: data.project,
          message: data.message,
        },
        config.publicKey
      ),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Contact request timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
