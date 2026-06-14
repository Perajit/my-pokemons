"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "./actions";
import { validateDisplayName, MAX_DISPLAY_NAME_LENGTH } from "./validation";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const error = validateDisplayName(name);
  const unchanged = name.trim() === initialName.trim();
  const canSave = !pending && !error && !unchanged;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    startTransition(async () => {
      const result = await updateProfileAction(name);
      if (result.ok) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="name"
          value={name}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          aria-invalid={touched && error ? true : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setTouched(true);
          }}
        />
        {touched && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
      <Button type="submit" disabled={!canSave}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
