import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SignalScore,
  ScoringSignal,
  Temperature,
} from "@/features/inquiries/qualification/types";
import { TemperatureBadge } from "./temperature-badge";

const signalLabels: Record<ScoringSignal, string> = {
  budget_presence: "Budget",
  deadline_urgency: "Deadline",
  pricing_match: "Pricing Match",
  customer_history: "Customer History",
  detail_completeness: "Detail Completeness",
};

type QualificationBreakdownProps = {
  signals: SignalScore[];
  compositeScore: number;
  temperature: Temperature;
};

export function QualificationBreakdown({
  signals,
  compositeScore,
  temperature,
}: QualificationBreakdownProps) {
  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardTitle>Qualification</CardTitle>
          <TemperatureBadge temperature={temperature} />
        </div>
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {compositeScore}
          <span className="text-sm font-normal text-muted-foreground">
            /100
          </span>
        </span>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {signals.map((signal) => (
            <SignalRow key={signal.signal} signal={signal} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SignalRow({ signal }: { signal: SignalScore }) {
  const label = signalLabels[signal.signal];
  const isMissingData = signal.points === 0 && signal.reason === null;

  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {isMissingData ? (
        <span className="text-xs text-muted-foreground/60">N/A</span>
      ) : (
        <span className="font-medium tabular-nums">
          {signal.points}
          <span className="text-muted-foreground">/{signal.maxPoints}</span>
        </span>
      )}
    </li>
  );
}
