import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Upload, CreditCard, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  transporterName: string;
  paidBy: "client" | "coordinator";
  onSuccess?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  requestId,
  transporterName,
  paidBy,
  onSuccess
}: PaymentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [receiptPhoto, setReceiptPhoto] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!receiptPhoto) {
        throw new Error(t('paymentDialog.receiptRequired'));
      }
      if (rating === 0) {
        throw new Error(t('paymentDialog.ratingRequired'));
      }

      // Submit payment and rating in one request
      await apiRequest(`/api/requests/${requestId}/payment`, "POST", {
        paymentReceipt: receiptPhoto,
        paidBy,
        rating,
        comment
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/coordinator/requests'] });
      toast({
        title: t('paymentDialog.success'),
        description: t('paymentDialog.successDesc'),
      });
      onSuccess?.();
      onOpenChange(false);
      // Reset form
      setReceiptPhoto("");
      setRating(0);
      setComment("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t('paymentDialog.error'),
        description: error.message || t('paymentDialog.errorDesc'),
      });
    }
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t('paymentDialog.photoTooLarge'),
        description: t('paymentDialog.photoTooLargeDesc'),
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    paymentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-6 w-6 text-emerald-500" />
            {t('paymentDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('paymentDialog.description', { transporterName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Receipt */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('paymentDialog.uploadReceipt')}
            </Label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="receipt-upload"
                data-testid="input-receipt-upload"
              />
              <label htmlFor="receipt-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full hover-elevate active-elevate-2"
                  asChild
                  data-testid="button-upload-receipt"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" />
                    {receiptPhoto ? t('paymentDialog.changeReceipt') : t('paymentDialog.selectReceipt')}
                  </span>
                </Button>
              </label>

              {receiptPhoto && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <img 
                    src={receiptPhoto} 
                    alt="Receipt" 
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 ltr:right-2 rtl:left-2 h-8 w-8 bg-background/80 backdrop-blur-sm"
                    onClick={() => setReceiptPhoto("")}
                    data-testid="button-remove-receipt"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Rate Transporter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('paymentDialog.rateTransporter')}
            </Label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && t('paymentDialog.excellent')}
                {rating === 4 && t('paymentDialog.veryGood')}
                {rating === 3 && t('paymentDialog.good')}
                {rating === 2 && t('paymentDialog.average')}
                {rating === 1 && t('paymentDialog.poor')}
              </p>
            )}
          </div>

          {/* Optional Comment */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-base font-semibold">
              {t('paymentDialog.comment')} {t('paymentDialog.optional')}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('paymentDialog.commentPlaceholder')}
              className="min-h-20 resize-none"
              data-testid="textarea-comment"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={paymentMutation.isPending}
            data-testid="button-cancel-payment"
          >
            {t('paymentDialog.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={paymentMutation.isPending || !receiptPhoto || rating === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            data-testid="button-confirm-payment"
          >
            {paymentMutation.isPending ? (
              <>
                <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                {t('paymentDialog.submitting')}
              </>
            ) : (
              <>
                <CreditCard className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('paymentDialog.confirm')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
