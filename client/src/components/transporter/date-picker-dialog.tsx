import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="sm:max-w-[460px] bg-gradient-to-br from-slate-900 to-slate-950 border border-[#1abc9c]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="p-2 bg-gradient-to-br from-[#1abc9c] to-[#16a085] rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            {t('transporterDashboard.datePickerDialog.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('transporterDashboard.datePickerDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="rounded-lg border border-[#1abc9c]/20 mx-auto"
            data-testid="calendar-availability"
            locale={dateLocale}
            modifiers={{
              today: () => false
            }}
          />

          {selectedDate && (
            <div className="rounded-lg border border-[#1abc9c]/30 bg-[#1abc9c]/10 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#1abc9c] to-[#16a085] rounded-lg shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">
                    {t('transporterDashboard.datePickerDialog.selectedDate')}
                  </p>
                  <p className="text-lg font-bold text-[#1abc9c]">
                    {format(selectedDate, "dd MMMM yyyy", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1 h-11 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              data-testid="button-cancel-availability"
            >
              {t('transporterDashboard.datePickerDialog.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || isPending}
              className="flex-1 h-11 relative overflow-hidden bg-gradient-to-r from-[#1abc9c] to-[#16a085] hover:from-[#16a085] hover:to-[#1abc9c] text-white font-semibold shadow-lg hover:shadow-[#1abc9c]/50 transition-all duration-300 group"
              data-testid="button-confirm-interest"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              <CheckCircle className={`h-5 w-5 mr-2 ${isPending ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-300'}`} />
              <span>
                {isPending ? t('transporterDashboard.datePickerDialog.pending') : t('transporterDashboard.datePickerDialog.confirmInterest')}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
