interface CloudinaryOptions {
  width: number;
  quality?: 'auto' | number;
}

export function cloudinaryImage(url: string, { width, quality = 'auto' }: CloudinaryOptions): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_${quality},f_auto/`);
}

export function cloudinarySrcSet(url: string, widths: number[]): string | undefined {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return undefined;
  return widths.map((width) => `${cloudinaryImage(url, { width })} ${width}w`).join(', ');
}
