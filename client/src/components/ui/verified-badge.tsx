import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  isVerified: boolean;
  className?: string;
}

export function VerifiedBadge({ isVerified, className = "" }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 ${className}`}
            data-testid="badge-verified"
          >
            <CheckCircle className="w-3 h-3" />
            Vérifié
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Transporteur vérifié par CamionBack avec référence professionnelle validée</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
