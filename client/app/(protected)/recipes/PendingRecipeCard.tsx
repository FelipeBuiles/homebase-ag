import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ParsingStatus = "idle" | "pending" | "parsing" | "filled" | "error";

type PendingRecipeCardProps = {
  parsingStatus?: ParsingStatus | null;
  variant?: "list" | "detail";
  actions?: React.ReactNode;
};

const stepState = (step: "fetch" | "parse" | "fill", status: ParsingStatus) => {
  if (status === "filled") return "done";
  if (status === "error") return step === "fetch" ? "done" : "pending";
  if (step === "fetch") return "done";
  if (step === "parse") return status === "parsing" ? "active" : "pending";
  return "pending";
};

export function PendingRecipeCard({
  parsingStatus = "pending",
  variant = "list",
  actions,
}: PendingRecipeCardProps) {
  const status = parsingStatus ?? "pending";
  const steps = [
    { label: "Fetch", state: stepState("fetch", status) },
    { label: "Parse", state: stepState("parse", status) },
    { label: "Fill", state: stepState("fill", status) },
  ];

  return (
    <Card className={variant === "detail" ? "border-dashed" : undefined}>
      <CardHeader>
        <CardTitle className="text-base">
          {status === "error" ? "Parsing needs attention" : "Parsing recipe"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-2">
              <span
                className={
                  step.state === "done"
                    ? "text-primary"
                    : step.state === "active"
                      ? "text-foreground"
                      : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
              {step.label !== "Fill" && <span className="text-muted-foreground">•</span>}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {status === "error"
            ? "We ran into an issue while parsing. You can edit this recipe manually."
            : variant === "detail"
              ? "You can close this page and come back later. This recipe will appear once it's ready."
              : "You can close the modal and come back later. This recipe will appear once it's ready."}
        </p>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
