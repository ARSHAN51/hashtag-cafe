import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
};

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div className="panel flex flex-col items-center rounded-[1.9rem] px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-yellow-400/12 text-yellow-300 shadow-lg shadow-yellow-500/10">
        {icon ?? <CircleAlert className="h-6 w-6" />}
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "mt-6 justify-center",
            }),
          )}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
