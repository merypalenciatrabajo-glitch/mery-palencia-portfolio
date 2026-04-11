import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';

/**
 * TARJETA DE GALERÍA
 * Muestra una ilustración con likes y opciones de compartir
 */

interface GalleryCardProps {
  id: string;
  title: string;
  image: string;
  description: string;
  initialLikes: number;
  onImageClick: () => void;
}

export default function GalleryCard({
  id,
  title,
  image,
  description,
  initialLikes,
  onImageClick,
}: GalleryCardProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: window.location.href,
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer"
      onClick={onImageClick}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden bg-background dark:bg-slate-900 rounded-lg">
        <img
          src={image}
          alt={title}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay oscuro en hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />

        {/* Acciones */}
        <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Likes y compartir */}
          <div className="flex gap-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-foreground transition-all"
              title="Me gusta"
            >
              <Heart
                size={18}
                className={liked ? 'fill-accent text-accent' : ''}
              />
              <span className="text-sm font-medium">{likes}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-foreground transition-all"
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Expandir */}
          <div className="text-white text-sm font-medium bg-black/50 px-3 py-2 rounded-lg">
            Ver
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
