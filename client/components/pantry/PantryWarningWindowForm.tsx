import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePantryWarningWindow } from "@/app/(protected)/pantry/actions";

export const PantryWarningWindowForm = ({ value }: { value: number }) => {
  return (
    <form action={updatePantryWarningWindow} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="pantryWarningDays">Warning window (days)</Label>
        <Input
          id="pantryWarningDays"
          name="pantryWarningDays"
          type="number"
          min={1}
          defaultValue={value}
          className="w-32"
        />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
};
