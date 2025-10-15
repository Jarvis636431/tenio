import { ReactNode } from "react";

interface PageHeaderProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex items-center">
        {title && (
          <h1 className="text-xl font-semibold text-foreground">
            {title}
          </h1>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

