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
          className="h-8 px-3 text-xs font-medium"
          data-testid="button-lang-fr"
        >
          <span className="text-base mr-1">🇫🇷</span>
          FR
        </Button>
        <Button
          variant={i18n.language === 'ar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('ar')}
          className="h-8 px-3 text-xs font-medium"
          data-testid="button-lang-ar"
        >
          <span className="text-base mr-1">🇲🇦</span>
          AR
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto" data-testid="language-selector">
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground mb-2">
          <Globe className="w-5 h-5" />
          <p className="text-sm font-medium">
            {i18n.language === 'fr' ? 'Choisissez votre langue' : 'اختر لغتك'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={i18n.language === 'fr' ? 'default' : 'outline'}
          size="lg"
          onClick={() => changeLanguage('fr')}
          className={`h-auto py-6 flex flex-col gap-3 transition-all ${
            i18n.language === 'fr' 
              ? 'bg-[#17cfcf] hover:bg-[#14b8b8] text-white shadow-lg scale-105' 
              : 'hover:bg-accent'
          }`}
          data-testid="button-select-french"
        >
          <span className="text-4xl">🇫🇷</span>
          <span className="text-lg font-semibold">Français</span>
          {i18n.language === 'fr' && (
            <span className="text-xs opacity-90">Langue sélectionnée</span>
          )}
        </Button>

        <Button
          variant={i18n.language === 'ar' ? 'default' : 'outline'}
          size="lg"
          onClick={() => changeLanguage('ar')}
          className={`h-auto py-6 flex flex-col gap-3 transition-all ${
            i18n.language === 'ar' 
              ? 'bg-[#17cfcf] hover:bg-[#14b8b8] text-white shadow-lg scale-105' 
              : 'hover:bg-accent'
          }`}
          data-testid="button-select-arabic"
        >
          <span className="text-4xl">🇲🇦</span>
          <span className="text-lg font-semibold">العربية</span>
          {i18n.language === 'ar' && (
            <span className="text-xs opacity-90">اللغة المحددة</span>
          )}
        </Button>
      </div>
    </div>
  );
}
