import { EmptyState } from "@/components/ui/empty-state";

interface AdminComingSoonProps {
  title: string;
  description: string;
}

export function AdminComingSoon({ title, description }: AdminComingSoonProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        title={`${title} coming soon`}
        description="This section is scaffolded in the admin shell and will be wired up next."
        tone="dark"
      />
    </main>
  );
}
