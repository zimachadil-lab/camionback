import { Truck } from "lucide-react";

interface LoadingTruckProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animation de chargement avec camion roulant sur route
 * Utilisée partout sur CamionBack pour une expérience cohérente
 */
export function LoadingTruck({ message = "Chargement en cours...", size = "md" }: LoadingTruckProps) {
  const sizeClasses = {
    sm: { container: "w-32 h-16", truck: "w-12 h-12", text: "text-sm" },
    md: { container: "w-48 h-24", truck: "w-16 h-16", text: "text-lg" },
    lg: { container: "w-64 h-32", truck: "w-20 h-20", text: "text-xl" }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6" data-testid="loading-truck">
      {/* Animation de chargement avec camion */}
      <div className={`relative ${classes.container}`}>
        {/* Route (ligne grise avec gradient turquoise) */}
        <div className="absolute bottom-8 left-0 w-full h-1 bg-gray-300 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] rounded-full animate-pulse" />
        </div>
        {/* Camion qui roule */}
        <div className={`absolute bottom-0 left-0 ${classes.truck} animate-[drive_2s_ease-in-out_infinite]`}>
          <Truck className="w-full h-full text-[#17cfcf]" />
        </div>
      </div>
      {/* Message de chargement */}
      {message && (
        <p className={`${classes.text} font-medium text-[#17cfcf] animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
}
