import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LanguageSelectorProps {
  userId?: string;
}

export function LanguageSelector({ userId }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
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
    { code: 'fr', label: 'Français', nativeLabel: 'FR' },
    { code: 'ar', label: 'العربية', nativeLabel: 'AR' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-language-selector">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="gap-2 cursor-pointer"
            data-testid={`language-option-${lang.code}`}
          >
            <span className={i18n.language === lang.code ? 'font-bold' : ''}>
              {lang.label} ({lang.nativeLabel})
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
