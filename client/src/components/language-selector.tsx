import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';

export function LanguageSelector({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 bg-card/50 backdrop-blur-sm rounded-lg p-1 border">
        <Button
          variant={i18n.language === 'fr' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('fr')}
          data-testid="button-lang-fr"
        >
          FR
        </Button>
        <Button
          variant={i18n.language === 'ar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('ar')}
          data-testid="button-lang-ar"
        >
          ع
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto" data-testid="language-selector">
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Globe className="w-4 h-4" />
          <p className="text-xs font-medium">
            {i18n.language === 'fr' ? 'Choisissez votre langue' : 'اختر لغتك'}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant={i18n.language === 'fr' ? 'default' : 'outline'}
          onClick={() => changeLanguage('fr')}
          className="flex-1"
          data-testid="button-select-french"
        >
          <span className="font-semibold">Français</span>
        </Button>

        <Button
          variant={i18n.language === 'ar' ? 'default' : 'outline'}
          onClick={() => changeLanguage('ar')}
          className="flex-1"
          data-testid="button-select-arabic"
        >
          <span className="font-semibold">العربية</span>
        </Button>
      </div>
    </div>
  );
}
