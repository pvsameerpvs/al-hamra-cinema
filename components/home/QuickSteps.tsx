import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Pick a seat",
    description: "Choose Balcony or Orchestra, then tap an available seat.",
  },
  {
    title: "Enter details",
    description: "Add your name and phone number for the booking.",
  },
  {
    title: "Confirm booking",
    description: "Get instant confirmation. Seat map refreshes automatically.",
  },
];

export function QuickSteps() {
  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-base">How it works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((s, idx) => (
          <div key={s.title} className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {idx + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            Tip: green is available, yellow is reserved, red is booked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
