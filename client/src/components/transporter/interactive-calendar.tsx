import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Truck, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO, getYear, setYear } from "date-fns";
import { fr } from "date-fns/locale";

interface InteractiveCalendarProps {
  requests: any[];
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export function InteractiveCalendar({ requests, onDateSelect, selectedDate }: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get unique years from requests
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear + 1);
    
    requests.forEach((req) => {
      if (req.pickupDate) {
        years.add(getYear(parseISO(req.pickupDate)));
      }
      if (req.deliveryDate) {
        years.add(getYear(parseISO(req.deliveryDate)));
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [requests]);

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();
  const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0

  // Get requests by date
  const requestsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    requests.forEach((req) => {
      const dateKey = req.pickupDate || req.deliveryDate;
      if (dateKey) {
        const key = format(parseISO(dateKey), "yyyy-MM-dd");
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(req);
      }
    });
    return map;
  }, [requests]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const monthRequests = requests.filter((req) => {
      const reqDate = req.pickupDate || req.deliveryDate;
      if (!reqDate) return false;
      return isSameMonth(parseISO(reqDate), currentDate);
    });

    const totalAmount = monthRequests.reduce((sum, req) => {
      const offer = req.offers?.find((o: any) => o.status === "accepted");
      return sum + (offer?.amount || 0);
    }, 0);

    const nextDelivery = monthRequests
      .filter((req) => {
        const reqDate = parseISO(req.pickupDate || req.deliveryDate);
        return reqDate >= new Date();
      })
      .sort((a, b) => {
        const dateA = parseISO(a.pickupDate || a.deliveryDate);
        const dateB = parseISO(b.pickupDate || b.deliveryDate);
        return dateA.getTime() - dateB.getTime();
      })[0];

    return {
      count: monthRequests.length,
      totalAmount,
      nextDelivery: nextDelivery ? parseISO(nextDelivery.pickupDate || nextDelivery.deliveryDate) : null,
    };
  }, [requests, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleYearChange = (year: string) => {
    setCurrentDate(setYear(currentDate, parseInt(year)));
  };

  const handleDayClick = (day: Date) => {
    if (selectedDate && isSameDay(day, selectedDate)) {
      onDateSelect(null); // Deselect if clicking the same date
    } else {
      onDateSelect(day);
    }
  };

  const getDayClasses = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const hasRequests = requestsByDate.has(dayKey);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isToday = isSameDay(day, new Date());
    const requestCount = requestsByDate.get(dayKey)?.length || 0;

    let classes = "relative flex flex-col items-center justify-center h-12 rounded-md transition-all cursor-pointer ";

    if (isSelected) {
      classes += "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ";
    } else if (hasRequests) {
      classes += "hover-elevate active-elevate-2 bg-card/50 ";
    } else {
      // Days without requests are still clickable but more subtle
      classes += "text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground ";
    }

    if (isToday && !isSelected) {
      classes += "ring-1 ring-primary/30 ";
    }

    return classes;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Mes commandes à traiter – {format(currentDate, "MMMM yyyy", { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select value={getYear(currentDate).toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleNextMonth} data-testid="button-next-month">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for padding */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`padding-${i}`} className="h-12" />
            ))}

            {/* Actual days */}
            {daysInMonth.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayRequests = requestsByDate.get(dayKey) || [];
              const requestCount = dayRequests.length;

              return (
                <div
                  key={day.toISOString()}
                  className={getDayClasses(day)}
                  onClick={() => handleDayClick(day)}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <span className="text-sm font-medium">{format(day, "d")}</span>
                  {requestCount > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {requestCount > 1 && (
                        <Truck className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{monthlyStats.count}</span>
              <span className="text-muted-foreground">
                {monthlyStats.count === 0 ? "commande" : monthlyStats.count === 1 ? "commande" : "commandes"} ce mois-ci
              </span>
            </div>
            {monthlyStats.totalAmount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">💰 Revenu estimé :</span>
                <Badge variant="secondary" className="font-semibold">
                  {monthlyStats.totalAmount.toLocaleString()} MAD
                </Badge>
              </div>
            )}
          </div>
          {monthlyStats.nextDelivery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>🗓️ Prochaine livraison :</span>
              <span className="font-medium text-foreground">
                {format(monthlyStats.nextDelivery, "d MMMM yyyy", { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Selected date info */}
        {selectedDate && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Commandes du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateSelect(null)}
                data-testid="button-clear-date-filter"
              >
                Voir tout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
