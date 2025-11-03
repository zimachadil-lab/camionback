import { Truck } from "lucide-react";

interface LoadingTruckProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animation de chargement avec camion roulant sur route
 * Utilisée partout sur CamionBack pour une expérience cohérente
 */
export function LoadingTruck({ message = "Chargement...", size = "md" }: LoadingTruckProps) {
  const sizeClasses = {
    sm: { container: "w-32 h-16", truck: "w-12 h-12", text: "text-sm" },
    md: { container: "w-56 h-28", truck: "w-20 h-20", text: "text-base" },
    lg: { container: "w-72 h-36", truck: "w-24 h-24", text: "text-lg" }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8" data-testid="loading-truck">
      {/* Animation de chargement avec camion - Design amélioré */}
      <div className={`relative ${classes.container}`}>
        {/* Effet de lueur derrière le camion */}
        <div className="absolute bottom-0 left-0 w-full h-full">
          <div className="absolute bottom-8 left-1/4 w-1/2 h-8 bg-[#17cfcf]/20 rounded-full blur-xl animate-pulse" />
        </div>
        
        {/* Route avec animation de progression */}
        <div className="absolute bottom-8 left-0 w-full h-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full overflow-hidden shadow-lg">
          {/* Barre de progression animée */}
          <div className="h-full bg-gradient-to-r from-[#17cfcf] via-[#00ff88] to-[#17cfcf] rounded-full animate-[progress_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(23,207,207,0.5)]" 
               style={{ animation: "progress 2s ease-in-out infinite" }} />
        </div>
        
        {/* Camion qui roule avec ombre */}
        <div className={`absolute bottom-0 left-0 ${classes.truck} animate-[drive_2s_ease-in-out_infinite] drop-shadow-[0_4px_8px_rgba(23,207,207,0.3)]`}>
          <Truck className="w-full h-full text-[#17cfcf] drop-shadow-[0_0_8px_rgba(23,207,207,0.6)]" />
        </div>
      </div>
      
      {/* Message de chargement avec points animés */}
      {message && (
        <div className="flex items-center gap-1">
          <p className={`${classes.text} font-semibold bg-gradient-to-r from-[#17cfcf] to-[#00ff88] bg-clip-text text-transparent`}>
            {message}
          </p>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#17cfcf] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 bg-[#17cfcf] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 bg-[#17cfcf] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </span>
        </div>
      )}
    </div>
  );
}
