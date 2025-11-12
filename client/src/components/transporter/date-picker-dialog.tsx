import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon } from "lucide-react";

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {t('transporterDashboard.datePickerDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('transporterDashboard.datePickerDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="rounded-md border"
            data-testid="calendar-availability"
            locale={dateLocale}
            modifiers={{
              today: () => false
            }}
          />

          {selectedDate && (
            <div className="mt-4 p-3 bg-primary/10 rounded-md border border-primary/20">
              <p className="text-sm font-medium">
                {t('transporterDashboard.datePickerDialog.selectedDate')} {format(selectedDate, "dd MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          )}
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
            disabled={!selectedDate || isPending}
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
