import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr, ar } from "date-fns/locale";
import { CalendarIcon, CheckCircle, X, Sparkles } from "lucide-react";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(requestDate || new Date());

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  // Use appropriate locale for date-fns based on current language
  const dateLocale = i18n.language === 'ar' ? ar : fr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-2 border-teal-200 dark:border-teal-800">
        <DialogHeader className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 backdrop-blur-sm"></div>
          <DialogTitle className="relative flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarIcon className="h-6 w-6" />
            </div>
            {t('transporterDashboard.datePickerDialog.title')}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            data-testid="button-close-dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="rounded-xl border-2 border-teal-200 dark:border-teal-800 shadow-lg mx-auto bg-white dark:bg-slate-900"
            data-testid="calendar-availability"
            locale={dateLocale}
            modifiers={{
              today: () => false
            }}
          />

          {selectedDate && (
            <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 shadow-md">
              <div className="absolute top-0 right-0 opacity-10">
                <Sparkles className="h-20 w-20 text-emerald-500" />
              </div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t('transporterDashboard.datePickerDialog.selectedDate')}
                  </p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {format(selectedDate, "dd MMMM yyyy", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1 h-12 font-semibold border-2"
              data-testid="button-cancel-availability"
            >
              <X className="h-4 w-4 mr-2" />
              {t('transporterDashboard.datePickerDialog.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || isPending}
              className="flex-1 h-12 relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all group"
              data-testid="button-confirm-interest"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
              <CheckCircle className={`h-5 w-5 mr-2 relative ${isPending ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="relative">
                {isPending ? t('transporterDashboard.datePickerDialog.pending') : t('transporterDashboard.datePickerDialog.confirmInterest')}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
