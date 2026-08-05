import { describe, expect, it, vi } from 'vitest';
import { contactFormSchema, firstContactError, sendContactMessage } from '@/lib/contact';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const validContact = {
  name: '  Mery Palencia  ',
  email: 'mery@example.com',
  project: 'Diseño de personaje',
  message: 'Necesito una ilustración para un proyecto editorial.',
  website: '',
};

describe('formulario de contacto', () => {
  it('valida y normaliza una solicitud legítima', () => {
    const result = contactFormSchema.parse(validContact);
    expect(result.name).toBe('Mery Palencia');
    expect(result.email).toBe('mery@example.com');
  });

  it('rechaza correos inválidos y mensajes insuficientes', () => {
    const result = contactFormSchema.safeParse({ ...validContact, email: 'incorrecto', message: 'Muy corto' });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstContactError(result.error)).toBeTruthy();
  });

  it('rechaza el campo trampa utilizado por bots', () => {
    const result = contactFormSchema.safeParse({ ...validContact, website: 'https://spam.example' });
    expect(result.success).toBe(false);
  });

  it('no publica enlaces de contacto ficticios', () => {
    const socialRail = readFileSync(resolve(__dirname, '../components/SocialRail.tsx'), 'utf-8');
    expect(socialRail).not.toContain('href="https://instagram.com"');
    expect(socialRail).not.toContain('href="https://facebook.com"');
    expect(socialRail).not.toContain('mailto:mery@example.com');
    expect(socialRail).toContain('VITE_CONTACT_EMAIL');
    expect(socialRail).toContain('VITE_INSTAGRAM_URL');
    expect(socialRail).toContain('VITE_FACEBOOK_URL');
  });

  it('envía al transporte configurado con los campos esperados', async () => {
    const transport = vi.fn().mockResolvedValue({ status: 200 });
    await sendContactMessage(contactFormSchema.parse(validContact), {
      serviceId: 'service', templateId: 'template', publicKey: 'public',
    }, { transport });

    expect(transport).toHaveBeenCalledWith('service', 'template', expect.objectContaining({
      from_name: 'Mery Palencia',
      reply_to: 'mery@example.com',
    }), 'public');
  });

  it('rechaza servicios sin configurar y envíos que agotan el tiempo', async () => {
    const data = contactFormSchema.parse(validContact);
    await expect(sendContactMessage(data, { serviceId: '', templateId: '', publicKey: '' })).rejects.toThrow('configuration');
    await expect(sendContactMessage(data, {
      serviceId: 'service', templateId: 'template', publicKey: 'public',
    }, { timeoutMs: 5, transport: () => new Promise(() => undefined) })).rejects.toThrow('timed out');
  });
});
