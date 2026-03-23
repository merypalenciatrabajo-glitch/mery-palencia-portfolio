import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * BOTÓN DE CAMBIO DE TEMA
 * Permite cambiar entre tema claro y oscuro
 * El tema se guarda en localStorage
 */

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary hover:bg-muted transition-colors duration-300"
      aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
      title={`Tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-foreground" />
      ) : (
        <Sun size={20} className="text-foreground" />
      )}
    </button>
  );
}
