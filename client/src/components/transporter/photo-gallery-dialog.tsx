import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PhotoGalleryDialogProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
  referenceId: string;
}

export function PhotoGalleryDialog({ open, onClose, photos, referenceId }: PhotoGalleryDialogProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (!photos || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[92vw] sm:max-w-5xl max-h-[90vh] p-3 sm:p-6 overflow-y-auto" data-testid="dialog-photo-gallery">
        <div className="relative">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={photos[currentIndex]}
              alt={`${t('transporterDashboard.photoGalleryDialog.photo')} ${currentIndex + 1}`}
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleImageClick}
              data-testid={`img-gallery-${currentIndex}`}
            />

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute start-1 sm:start-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-2 border-white/50 shadow-xl h-10 w-10 sm:h-12 sm:w-12"
                  onClick={handlePrevious}
                  data-testid="button-previous-photo"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 rtl:rotate-180 stroke-[3]" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 sm:end-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-2 border-white/50 shadow-xl h-10 w-10 sm:h-12 sm:w-12"
                  onClick={handleNext}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 rtl:rotate-180 stroke-[3]" />
                </Button>

                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-bold border-2 border-white/30 shadow-xl">
                  {currentIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          {/* Séparateur visible */}
          <div className="mt-4 mb-3 border-t-2 border-muted"></div>
          
          {/* Titre de la section miniatures */}
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Toutes les photos ({photos.length})
          </p>

          {/* Grid de miniatures - TRÈS VISIBLE */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border-2 border-muted">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all hover:scale-105 hover:shadow-lg ${
                  idx === currentIndex 
                    ? "border-primary shadow-lg ring-4 ring-primary/30" 
                    : "border-muted-foreground/30 hover:border-primary/50"
                }`}
                data-testid={`button-thumbnail-${idx}`}
              >
                <img
                  src={photo}
                  alt={`${t('transporterDashboard.photoGalleryDialog.thumbnail')} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Badge numéro */}
                <div className="absolute top-1 right-1 bg-black/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={handleCloseFullscreen}
          data-testid="fullscreen-overlay"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 end-4 text-white hover:bg-white/20 h-10 w-10"
            onClick={handleCloseFullscreen}
            data-testid="button-close-fullscreen"
          >
            <X className="h-6 w-6" />
          </Button>

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute start-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                data-testid="button-fullscreen-previous"
              >
                <ChevronLeft className="h-8 w-8 rtl:rotate-180" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute end-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                data-testid="button-fullscreen-next"
              >
                <ChevronRight className="h-8 w-8 rtl:rotate-180" />
              </Button>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full text-sm font-medium">
                {currentIndex + 1} / {photos.length}
              </div>
            </>
          )}

          <img
            src={photos[currentIndex]}
            alt={`${t('transporterDashboard.photoGalleryDialog.photo')} ${currentIndex + 1} ${t('transporterDashboard.photoGalleryDialog.fullscreen')}`}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-fullscreen"
          />
        </div>
      )}
    </Dialog>
  );
}
