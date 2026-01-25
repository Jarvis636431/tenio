import { ReactNode } from "react";

interface ProjectHeaderProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  titleExtra?: ReactNode;
}

export function ProjectHeader({
  title,
  actions,
  className = "",
  titleExtra,
}: ProjectHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex items-center">
        {title && (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              {title}
            </h1>
            {titleExtra && (
              <span className="ml-3 text-sm text-muted-foreground whitespace-nowrap">
                {titleExtra}
              </span>
            )}
          </>
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
