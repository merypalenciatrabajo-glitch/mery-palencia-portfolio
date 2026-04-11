/**
 * DATOS DE TESTIMONIOS
 * Reseñas y testimonios de clientes satisfechos
 */

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sofia García',
    company: 'Luna Branding',
    role: 'Directora Creativa',
    content: 'Mery transformó completamente nuestra visión en ilustraciones impactantes. Su atención al detalle y creatividad superaron nuestras expectativas. Definitivamente trabajaremos con ella nuevamente.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  },
  {
    id: '2',
    name: 'Carlos Mendez',
    company: 'Digital Studios',
    role: 'Productor de Contenido',
    content: 'Las ilustraciones de Mery agregaron un nivel de profesionalismo increíble a nuestro proyecto. Es una artista talentosa con excelente comunicación y entrega puntual.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: '3',
    name: 'María López',
    company: 'Agencia Creativa Nexus',
    role: 'Gerente de Proyectos',
    content: 'Trabajar con Mery fue una experiencia excepcional. Su proceso creativo es transparente, sus diseños son únicos y su profesionalismo es impecable. Altamente recomendada.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
];
