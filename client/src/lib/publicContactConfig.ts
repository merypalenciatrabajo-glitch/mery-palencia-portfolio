// EmailJS usa estos identificadores en el navegador; no son credenciales
// administrativas. Las variables de entorno siguen teniendo prioridad para
// permitir cambiar de servicio sin modificar el código.
const DEFAULT_CONTACT_EMAIL = 'merypalenciatrabajo@gmail.com';
const DEFAULT_EMAILJS_SERVICE_ID = 'service_portfolio';
const DEFAULT_EMAILJS_TEMPLATE_ID = 'template_b80smad';
const DEFAULT_EMAILJS_PUBLIC_KEY = 'ZLrXjIYd_3R2ZklPB';

const valueOrDefault = (value: string | undefined, fallback: string) =>
  value?.trim() || fallback;

const configuredEmail = valueOrDefault(
  import.meta.env.VITE_CONTACT_EMAIL,
  DEFAULT_CONTACT_EMAIL,
);

export const CONTACT_EMAIL = /^\S+@\S+\.\S+$/.test(configuredEmail)
  ? configuredEmail
  : DEFAULT_CONTACT_EMAIL;

export const EMAILJS_CONFIG = {
  serviceId: valueOrDefault(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    DEFAULT_EMAILJS_SERVICE_ID,
  ),
  templateId: valueOrDefault(
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    DEFAULT_EMAILJS_TEMPLATE_ID,
  ),
  publicKey: valueOrDefault(
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    DEFAULT_EMAILJS_PUBLIC_KEY,
  ),
} as const;
