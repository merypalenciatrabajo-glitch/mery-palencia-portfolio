/**
 * DATOS DE GALERÍA MEJORADOS
 * Incluye categorías, likes y más información
 */

export type GalleryCategory = 'personajes' | 'escenarios' | 'props';

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: GalleryCategory;
  description: string;
  likes: number;
}

export const galleryItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Mujer con Flores',
    image: 'https://cdn.example.com/gallery-1.png',
    category: 'personajes',
    description: 'Retrato digital de mujer con elementos botánicos',
    likes: 245,
  },
  {
    id: '2',
    title: 'Paisaje Sereno',
    image: 'https://cdn.example.com/gallery-2.png',
    category: 'escenarios',
    description: 'Paisaje con montañas y lago al atardecer',
    likes: 189,
  },
  {
    id: '3',
    title: 'Retrato Expresivo',
    image: 'https://cdn.example.com/gallery-3.png',
    category: 'personajes',
    description: 'Retrato con tonos cálidos y detalles intrincados',
    likes: 312,
  },
  {
    id: '4',
    title: 'Composición Abstracta',
    image: 'https://cdn.example.com/gallery-4.png',
    category: 'props',
    description: 'Formas orgánicas y paleta armónica',
    likes: 156,
  },
];

export const categories: { value: GalleryCategory; label: string }[] = [
  { value: 'personajes', label: 'Personajes' },
  { value: 'escenarios', label: 'Escenarios' },
  { value: 'props', label: 'Props' },
];
