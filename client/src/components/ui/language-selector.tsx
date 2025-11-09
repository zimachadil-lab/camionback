import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LanguageSelectorProps {
  userId?: string;
}

export function LanguageSelector({ userId }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const { toast } = useToast();

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      
      localStorage.setItem('preferredLanguage', lng);

      if (userId) {
        try {
          await apiRequest('PATCH', `/api/users/${userId}/language`, { preferredLanguage: lng });
        } catch (err) {
          console.error('Failed to persist language preference:', err);
        }
      }
    } catch (error) {
      console.error('Language change failed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer la langue",
        variant: "destructive",
      });
    }
  };

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          data-testid="button-language-selector"
        >
          <Languages className="w-5 h-5" />
          <span 
            className="absolute -bottom-0.5 -end-0.5 text-xs leading-none bg-background border border-border rounded-sm px-0.5 py-0.5 font-semibold min-w-[1rem] flex items-center justify-center"
            style={{ fontSize: '9px' }}
          >
            {currentLanguage.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="gap-3 cursor-pointer py-2.5"
            data-testid={`language-option-${lang.code}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {i18n.language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
