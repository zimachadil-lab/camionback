import { ReactNode } from "react";

interface TwoColumnGridProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function TwoColumnGrid({ children, className = "", testId }: TwoColumnGridProps) {
  return (
    <div 
      className={`grid gap-6 grid-cols-1 md:grid-cols-2 ${className}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
