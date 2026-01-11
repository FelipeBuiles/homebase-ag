"use client";

import { useActionState } from "react";
import { completeSetup } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: "" };

export function SetupForm() {
  const [state, formAction, pending] = useActionState(completeSetup, initialState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Welcome to HomeBase</CardTitle>
        <CardDescription>Set up your private household space.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Optional Password</Label>
            <Input id="password" name="password" type="password" placeholder="Leave blank for no password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" name="confirm" type="password" placeholder="Repeat password" />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            You can add or change the password later.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? "Setting up..." : "Complete Setup"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
