/**
 * DATOS DEL BLOG
 * Artículos sobre procesos creativos y pensamientos sobre la industria
 */

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'proceso' | 'industria' | 'tips' | 'experiencia';
  readTime: number;
  image: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'digital-vs-tradicional',
    title: 'Digital vs Tradicional: Mi Evolución como Ilustradora',
    excerpt: 'Reflexiono sobre mi transición de la ilustración tradicional al arte digital y lo que aprendí en el camino.',
    content: `Hace cinco años, mi estudio estaba lleno de lápices, acuarelas y papeles de diferentes texturas. La transición al arte digital fue aterradora. Recuerdo pensar que perdería la magia del trazo manual, esa conexión física entre la mano y el papel.

## El Primer Paso

Mi primer tablet fue una inversión importante. Pasé semanas simplemente jugando con los pinceles digitales, tratando de entender cómo replicar las técnicas que había perfeccionado durante años. Fue humilde, pero necesario.

## Descubrimientos Inesperados

Lo que no esperaba era la libertad que el arte digital me daría. Los "deshacer" ilimitados, las capas, los ajustes de color sin destruir el trabajo original... Estas herramientas me permitieron experimentar de formas que nunca fue posible con lápiz y papel.

## La Síntesis Perfecta

Hoy, mi proceso es una fusión. Comienzo con bocetos digitales rápidos, pero incorporo principios que aprendí del dibujo tradicional: la importancia del valor, la composición clásica, la calidad del trazo.

La verdad es que no fue elegir entre digital o tradicional. Fue aprender que cada medio tiene su magia, y la verdadera maestría está en entender cuándo usar cada uno.`,
    date: '2024-03-15',
    category: 'proceso',
    readTime: 5,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/gallery-1-kBV6WXPymKMbNyKr3qbDrm.webp',
    author: 'Mery Palencia',
  },
  {
    id: 'color-psicologia',
    title: 'La Psicología del Color en Ilustración Comercial',
    excerpt: 'Cómo elegir paletas de color que comuniquen emoción y conecten con la audiencia objetivo.',
    content: `El color es el lenguaje silencioso del arte. En la ilustración comercial, es mucho más que estética: es psicología aplicada.

## Entendiendo la Teoría

Cada color tiene asociaciones culturales y emocionales. El rojo evoca pasión y urgencia. El azul transmite confianza y calma. El amarillo sugiere optimismo y energía. Pero aquí está lo importante: estas asociaciones no son universales.

## Contexto es Rey

Cuando trabajo con clientes internacionales, investigo cómo su cultura percibe los colores. Lo que significa prosperidad en una región puede significar luto en otra. Esta investigación es tan importante como el diseño mismo.

## Mi Proceso de Selección

1. **Definir el Mensaje**: ¿Qué emoción debe sentir el espectador?
2. **Investigar la Audiencia**: ¿Quién es el público objetivo?
3. **Considerar el Contexto**: ¿Dónde se usará esta ilustración?
4. **Crear Armonía**: Busco paletas que funcionen juntas, no que compitan.

## Ejemplo Práctico

Para un cliente de tecnología, podría usar azules y grises (confianza, profesionalismo) con acentos de naranja (innovación, energía). Para una marca de bienestar, usaría verdes y tonos tierra (naturaleza, calma) con toques de lavanda (serenidad).

La paleta correcta no es la más bonita. Es la que comunica el mensaje correcto a la persona correcta.`,
    date: '2024-03-08',
    category: 'industria',
    readTime: 6,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/gallery-3-AUKbQzUKwMhpnorBhVvtcw.webp',
    author: 'Mery Palencia',
  },
  {
    id: 'herramientas-esenciales',
    title: '5 Herramientas Digitales que Transformaron mi Flujo de Trabajo',
    excerpt: 'Las aplicaciones y software que uso diariamente para crear ilustraciones profesionales.',
    content: `Después de años experimentando con diferentes herramientas, he encontrado mi stack perfecto. No es el más caro, pero es el más eficiente para mi flujo de trabajo.

## 1. Procreate - La Base de Todo

Procreate es donde vive la mayoría de mi trabajo. Sus pinceles son intuitivos, el rendimiento es impecable, y la interfaz se siente natural después de los primeros días.

## 2. Clip Studio Paint - Para Detalles Finos

Cuando necesito precisión extrema o efectos especiales, cambio a Clip Studio Paint. Sus herramientas de línea y perspectiva son incomparables.

## 3. Adobe Fresco - Experimentación Rápida

Para bocetos rápidos y exploración de ideas, Fresco es mi herramienta preferida. Los pinceles de acuarela digital son sorprendentemente realistas.

## 4. Figma - Colaboración y Maquetación

Para trabajos que requieren múltiples versiones o colaboración con clientes, Figma es invaluable. Puedo compartir archivos en tiempo real.

## 5. Affinity Photo - Edición y Composición

Aunque Photoshop es el estándar, Affinity Photo hace casi todo lo que necesito a una fracción del costo.

## El Secreto

No se trata de tener todas las herramientas. Se trata de dominar las que eliges y entender cuándo usarlas. Cada herramienta en mi kit existe porque resuelve un problema específico.`,
    date: '2024-02-28',
    category: 'tips',
    readTime: 5,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/gallery-2-MRjzJVyv9KSb5wqNmtK9ys.webp',
    author: 'Mery Palencia',
  },
  {
    id: 'trabajar-con-agencias',
    title: 'Lecciones Aprendidas: Trabajando con Agencias Creativas',
    excerpt: 'Mis experiencias colaborando con agencias y lo que he aprendido sobre comunicación, plazos y expectativas.',
    content: `Trabajar como freelancer ilustrador con agencias es diferente a trabajar directamente con clientes. He cometido errores, aprendido lecciones valiosas, y ahora quiero compartirlas.

## La Importancia de la Comunicación Clara

Mi primer proyecto con una agencia fue caótico. No establecí claramente qué se esperaba, cuántas revisiones estaban incluidas, o cuál era el presupuesto exacto. El resultado fue frustración mutua.

Ahora, antes de aceptar cualquier proyecto, tengo una conversación detallada:
- ¿Cuál es la visión exacta?
- ¿Cuántas revisiones están incluidas?
- ¿Cuál es el cronograma?
- ¿Cuáles son los entregables?

## Establecer Límites

Las agencias a veces esperan que seas flexible con todo. Aprendí que ser flexible en algunos aspectos (pequeños cambios de color, ajustes menores) pero firme en otros (cronograma, alcance del proyecto) es crucial.

## La Propuesta Escrita

Nunca trabajo sin una propuesta escrita. Protege tanto a la agencia como a mí. Especifica exactamente qué se entrega, cuándo, y qué pasa si hay cambios de alcance.

## Construir Relaciones a Largo Plazo

Las mejores oportunidades vinieron de agencias con las que trabajé bien. Si haces un buen trabajo, comunicas claramente, y entregas a tiempo, te llamarán de nuevo.

## El Valor del Portafolio

Una buena relación con una agencia puede llenar tu portafolio con trabajos profesionales. Esto, a su vez, atrae más clientes. Es un ciclo virtuoso si lo haces bien.`,
    date: '2024-02-15',
    category: 'experiencia',
    readTime: 6,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/gallery-4-HeZBEKPLMrW8DXQBuNQLtg.webp',
    author: 'Mery Palencia',
  },
  {
    id: 'anatomia-personajes',
    title: 'Anatomía para Ilustradores: Más Allá de lo Correcto',
    excerpt: 'Cómo entender la anatomía humana para crear personajes únicos y expresivos.',
    content: `Muchos ilustradores temen la anatomía. Piensan que necesitan ser perfectos, como un manual médico. Pero la verdad es diferente.

## Aprender las Reglas

Primero, necesitas entender la anatomía correcta. No puedes romper las reglas si no las conoces. Pasé meses estudiando proporciones, estructura ósea, y cómo se mueve el cuerpo.

## Luego, Rompe las Reglas

Una vez que entiendes la anatomía, puedes distorsionarla intencionalmente. Puedes hacer cabezas más grandes para caricatura, extremidades más largas para elegancia, o proporciones imposibles para fantasía.

## El Propósito de la Distorsión

La clave es que cada distorsión debe servir un propósito. ¿Quieres que el personaje se vea poderoso? Haz los hombros más anchos. ¿Quieres que se vea vulnerable? Reduce la altura general. ¿Quieres que se vea mágico? Rompe la anatomía de formas que sugieran movimiento sobrenatural.

## Práctica Constante

Dibujo anatomía regularmente. No solo figuras correctas, sino variaciones. Diferentes edades, cuerpos, proporciones. Esta práctica hace que sea segunda naturaleza cuando estoy en un proyecto real.

## El Resultado

Cuando dominas la anatomía, tienes libertad. Libertad para crear personajes memorables, expresivos, y únicos. Eso es lo que diferencia a un ilustrador competente de uno excepcional.`,
    date: '2024-02-01',
    category: 'proceso',
    readTime: 5,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/hero-illustration-h59MrgKS7TnNgq7RSR34Vn.webp',
    author: 'Mery Palencia',
  },
];

export const categories = [
  { id: 'proceso', label: 'Proceso Creativo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' },
  { id: 'industria', label: 'Industria', color: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' },
  { id: 'tips', label: 'Tips & Herramientas', color: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
  { id: 'experiencia', label: 'Experiencia', color: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100' },
];

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find(post => post.id === id);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getRelatedPosts(currentPostId: string, limit: number = 3): BlogPost[] {
  const currentPost = getBlogPostById(currentPostId);
  if (!currentPost) return [];

  return blogPosts
    .filter(post => post.id !== currentPostId && post.category === currentPost.category)
    .slice(0, limit);
}
