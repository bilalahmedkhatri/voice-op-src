"use client";

import { useContext, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceTitleContext } from "./WorkspaceTitleContext";

export default function WorkspacePageHeader({ title, description, icon, actions, breadcrumbs }: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}) {
  const setPageTitle = useContext(WorkspaceTitleContext);
  const pathname = usePathname();
  useEffect(() => {
    setPageTitle?.(typeof title === "string" || typeof title === "number" ? { pathname, title: String(title) } : null);
  }, [pathname, title, setPageTitle]);
  const hasTitle = title !== undefined && title !== null;
  if (!hasTitle && !description && !actions && !breadcrumbs) return null;
  return (
    <div className="space-y-3" data-workspace-page-header>
      {breadcrumbs && <div className="flex flex-wrap items-center gap-2 text-sm">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {(hasTitle || description) && <div className="min-w-0">
          {hasTitle && <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-start gap-2.5 break-words">
            {icon && <span className="flex shrink-0 items-center justify-center w-6 h-8 text-[#ff7d6e] [&>svg]:w-6 [&>svg]:h-6" aria-hidden="true">{icon}</span>}
            <span className="min-w-0">{title}</span>
          </h1>}
          {description && <div className="text-sm text-slate-500 mt-1">{description}</div>}
        </div>}
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0 ml-auto">{actions}</div>}
      </div>
    </div>
  );
}
