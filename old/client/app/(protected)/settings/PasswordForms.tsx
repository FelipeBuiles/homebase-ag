"use client";

import { useActionState } from "react";
import { updatePassword, removePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: "", success: "" };

export function UpdatePasswordForm({ requiresCurrent }: { requiresCurrent: boolean }) {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>{requiresCurrent ? "Change password" : "Set a password"}</CardTitle>
        <CardDescription>
          {requiresCurrent
            ? "Update the password for your local instance."
            : "Add a password to protect your HomeBase instance."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {requiresCurrent && (
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" name="current" type="password" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input id="next" name="next" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" name="confirm" type="password" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-primary">{state.success}</p>}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function RemovePasswordForm({ requiresCurrent }: { requiresCurrent: boolean }) {
  const [state, formAction, pending] = useActionState(removePassword, initialState);

  return (
    <Card className="border-destructive/30 bg-card/80">
      <CardHeader>
        <CardTitle>Remove password</CardTitle>
        <CardDescription>
          Disables password protection. Type REMOVE to confirm.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {requiresCurrent && (
            <div className="space-y-2">
              <Label htmlFor="current-remove">Current password</Label>
              <Input id="current-remove" name="current" type="password" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="confirm-remove">Type REMOVE</Label>
            <Input id="confirm-remove" name="confirm" placeholder="REMOVE" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Removing..." : "Remove password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
