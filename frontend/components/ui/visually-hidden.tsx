import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Visually Hidden component for screen readers
 * Content is accessible to screen readers but visually hidden
 */
export function VisuallyHidden({ 
  children, 
  className,
  ...props 
}: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

