import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  nextStep: string;
};

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  bullets,
  nextStep,
}: RoutePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">{eyebrow}</span>
        <div className="max-w-3xl space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Foundation delivered</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground"
              >
                {bullet}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next implementation slice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">{nextStep}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
