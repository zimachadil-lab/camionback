import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
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
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'ar', label: 'العربية', short: 'ع' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2"
          data-testid="button-language-selector"
        >
          <Globe className="w-4 h-4" />
          <span className="font-medium">{currentLanguage.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="gap-2 cursor-pointer"
            data-testid={`language-option-${lang.code}`}
          >
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
