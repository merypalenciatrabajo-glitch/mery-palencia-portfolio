import { ReactNode } from 'react';

/**
 * COMPONENTE DE TRANSICIÓN DE PÁGINA
 * Proporciona animaciones suaves al cambiar entre páginas
 */

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-in fade-in duration-500">
      {children}
    </div>
  );
}
