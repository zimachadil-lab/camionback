import { useState } from "react";
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
import { fr } from "date-fns/locale";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(requestDate);

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Choisir votre date de disponibilité
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la date à laquelle vous êtes disponible pour effectuer ce transport.
            {requestDate && (
              <span className="block mt-2 text-sm font-medium">
                Date demandée par le client : {format(requestDate, "dd MMMM yyyy", { locale: fr })}
              </span>
            )}
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
          />

          {selectedDate && (
            <div className="mt-4 p-3 bg-primary/10 rounded-md border border-primary/20">
              <p className="text-sm font-medium">
                Date sélectionnée : {format(selectedDate, "dd MMMM yyyy", { locale: fr })}
              </p>
              {requestDate && selectedDate.getTime() === requestDate.getTime() && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                  ✓ Correspond à la date du client
                </p>
              )}
              {requestDate && selectedDate.getTime() !== requestDate.getTime() && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  ⚠ Différente de la date demandée
                </p>
              )}
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
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            data-testid="button-confirm-interest"
          >
            {isPending ? "En cours..." : "Confirmer mon intérêt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
