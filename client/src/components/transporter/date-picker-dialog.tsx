import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { CalendarIcon, CheckCircle } from "lucide-react";

interface DatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  requestDate?: Date; // Original request date for comparison
  isPending?: boolean;
}

export function DatePickerDialog({
  open,
  onOpenChange,
  onConfirm,
  requestDate,
  isPending = false,
}: DatePickerDialogProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();

  const handleConfirm = () => {
    onConfirm(today);
  };

  // Use appropriate locale for date-fns based on current language
  const dateLocale = i18n.language === 'ar' ? ar : fr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {t('transporterDashboard.datePickerDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('transporterDashboard.datePickerDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
            <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('transporterDashboard.datePickerDialog.availableToday')}</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {format(today, "dd MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel-availability"
          >
            {t('transporterDashboard.datePickerDialog.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            data-testid="button-confirm-interest"
          >
            {isPending ? t('transporterDashboard.datePickerDialog.pending') : t('transporterDashboard.datePickerDialog.confirmInterest')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
