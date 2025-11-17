import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Phone, Calendar, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterestConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function InterestConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: InterestConfirmationDialogProps) {
  const { t, i18n } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        dir={i18n.dir()} 
        className="w-full max-w-sm sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border-2 border-[#17cfcf]/30 shadow-2xl p-0"
      >
        {/* Close button - visible on mobile */}
        <AlertDialogCancel 
          asChild
          className="absolute top-3 right-3 z-50"
        >
          <Button 
            size="icon" 
            variant="ghost"
            className="h-8 w-8 rounded-full"
            data-testid="button-close-interest-dialog"
            aria-label={i18n.language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogCancel>

        <div className="p-5">
          <AlertDialogHeader className="space-y-2.5">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <AlertDialogTitle className="text-center text-lg font-bold text-foreground">
            {i18n.language === 'ar' 
              ? 'تأكيد الاهتمام'
              : 'Confirmer votre intérêt'
            }
          </AlertDialogTitle>
          
          <AlertDialogDescription className="space-y-2.5 text-base" asChild>
            <div>
              {/* Key points - more compact */}
              <div className="space-y-2">
                {/* Point 1: Client notification */}
                <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                    {i18n.language === 'ar'
                      ? 'إشعار فوري للعميل'
                      : 'Notification immédiate au client'
                    }
                  </p>
                </div>

                {/* Point 2: Coordinator contact */}
                <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                    {i18n.language === 'ar'
                      ? 'اتصال المنسق خلال 24 ساعة'
                      : 'Contact coordinateur sous 24h'
                    }
                  </p>
                </div>

                {/* Point 3: 100% availability */}
                <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                    {i18n.language === 'ar'
                      ? 'توفر 100٪ مطلوب'
                      : 'Disponibilité 100% requise'
                    }
                  </p>
                </div>
              </div>

              {/* Final warning - more compact */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs font-bold text-center text-red-900 dark:text-red-100 leading-snug">
                  {i18n.language === 'ar'
                    ? 'إذا لم تكن متأكدًا 100٪، لا تضغط "تأكيد"'
                    : 'Si vous n\'êtes pas sûr à 100%, ne confirmez pas'
                  }
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel 
              className="flex-1 h-12 text-base font-semibold border-2 hover:bg-muted"
              data-testid="button-cancel-interest"
            >
              {i18n.language === 'ar' ? 'إلغاء' : 'Annuler'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] hover:from-[#15b8b8] hover:to-[#11a0a0] border-2 border-[#17cfcf]/30 shadow-lg"
              data-testid="button-confirm-interest"
            >
              {i18n.language === 'ar' ? 'تأكيد الاهتمام ✓' : 'Confirmer l\'intérêt ✓'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
