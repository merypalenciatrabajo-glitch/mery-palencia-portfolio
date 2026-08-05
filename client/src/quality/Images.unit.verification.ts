import { describe, expect, it } from 'vitest';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';

describe('optimización de imágenes', () => {
  const cloudinary = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

  it('solicita dimensiones, formato y calidad automáticos en Cloudinary', () => {
    expect(cloudinaryImage(cloudinary, { width: 600 })).toContain('/upload/w_600,c_limit,q_auto,f_auto/');
  });

  it('genera un srcset responsive', () => {
    expect(cloudinarySrcSet(cloudinary, [320, 640])).toContain('320w');
    expect(cloudinarySrcSet(cloudinary, [320, 640])).toContain('640w');
  });

  it('no altera proveedores desconocidos', () => {
    const external = 'https://example.com/image.jpg';
    expect(cloudinaryImage(external, { width: 600 })).toBe(external);
    expect(cloudinarySrcSet(external, [320, 640])).toBeUndefined();
  });
});
