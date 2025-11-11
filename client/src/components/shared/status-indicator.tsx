import { LucideIcon } from "lucide-react";

interface StatusIndicatorProps {
  text: string;
  icon: LucideIcon;
  isProcessing?: boolean;
}

/**
 * StatusIndicator component
 * 
 * Displays a status badge with an icon and text. 
 * When isProcessing is true, shows animated emerald gradient with spinning icon and ping effect.
 * When isProcessing is false, shows static teal gradient.
 * 
 * Used in both client and coordinator dashboards to display request statuses.
 */
export function StatusIndicator({ text, icon: Icon, isProcessing = false }: StatusIndicatorProps) {
  return (
    <div 
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 shadow-sm ${
        isProcessing 
          ? 'bg-gradient-to-r from-emerald-400/30 via-green-400/25 to-emerald-400/30 border-emerald-400/80' 
          : 'bg-gradient-to-r from-[#1abc9c]/20 via-[#16a085]/15 to-[#1abc9c]/20 border-[#1abc9c]/40'
      }`}
      data-testid="status-indicator"
    >
      <div className="relative flex-shrink-0">
        {isProcessing && (
          <div className="absolute inset-0 bg-emerald-400/50 rounded-full animate-ping"></div>
        )}
        <div className={`relative w-7 h-7 rounded-full flex items-center justify-center border-2 ${
          isProcessing 
            ? 'bg-emerald-400/40 border-emerald-400/90' 
            : 'bg-[#1abc9c]/20 border-[#1abc9c]/50'
        }`}>
          <Icon className={`w-4 h-4 ${
            isProcessing 
              ? 'text-emerald-400 animate-spin' 
              : 'text-[#1abc9c]'
          }`} />
        </div>
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${
        isProcessing ? 'text-emerald-300' : 'text-foreground'
      }`}>
        {text}
      </span>
    </div>
  );
}
