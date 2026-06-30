import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/80 p-6 shadow-panel">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-medium text-white">{title}</h2>
        {description ? <p className="text-sm text-mist/70">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
