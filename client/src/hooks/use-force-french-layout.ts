import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Hook to force French language and LTR direction for admin/coordinator dashboards.
 * Restores previous language, direction, and lang attribute on unmount.
 * Re-enforces French if language changes while dashboard is mounted.
 */
export function useForceFrenchLayout() {
  const { i18n } = useTranslation();
  const previousLanguage = useRef<string | null>(null);
  const previousDirection = useRef<string | null>(null);
  const previousLang = useRef<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Save previous state only on first mount
    if (!isInitialized.current) {
      previousLanguage.current = i18n.language;
      previousDirection.current = document.documentElement.dir || 'ltr';
      previousLang.current = document.documentElement.lang || '';
      isInitialized.current = true;
    }

    // Force French and LTR (runs on mount and whenever language changes)
    if (i18n.language !== 'fr') {
      i18n.changeLanguage('fr');
    }
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'fr';

    // Cleanup: restore previous state on unmount
    return () => {
      if (!isInitialized.current) return;
      
      // Restore previous language if it was different from French
      if (previousLanguage.current && previousLanguage.current !== 'fr') {
        i18n.changeLanguage(previousLanguage.current);
      }
      
      // Restore previous direction
      if (previousDirection.current) {
        document.documentElement.dir = previousDirection.current;
      }
      
      // Restore previous lang attribute
      if (previousLang.current !== null) {
        document.documentElement.lang = previousLang.current;
      }
      
      isInitialized.current = false;
    };
  }, [i18n, i18n.language]); // Re-run when language changes
}
