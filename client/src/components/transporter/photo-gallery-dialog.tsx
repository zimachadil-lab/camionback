import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

interface PhotoGalleryDialogProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
  referenceId: string;
}

export function PhotoGalleryDialog({ open, onClose, photos, referenceId }: PhotoGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden" data-testid="dialog-photo-gallery">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">
            Photos de la commande {referenceId}
          </DialogTitle>
        </DialogHeader>

        <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              className="w-full h-full object-cover sm:object-contain"
              data-testid={`img-gallery-${currentIndex}`}
            />

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handlePrevious}
                  data-testid="button-previous-photo"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleNext}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>

                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-background/90 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  idx === currentIndex ? "border-primary" : "border-transparent"
                }`}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img
                  src={photo}
                  alt={`Miniature ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
