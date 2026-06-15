"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameAction } from "@/app/(app)/collection/actions";
import {
  validateNickname,
  MAX_NICKNAME_LENGTH,
} from "@/app/(app)/collection/validation";

export function RenamePokemonDialog({
  userPokemonId,
  nickname,
  onRenamed,
}: {
  userPokemonId: string;
  nickname: string;
  onRenamed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(nickname);
  const [pending, startTransition] = useTransition();

  const error = validateNickname(value);
  const unchanged = value.trim() === nickname.trim();
  const canSave = !pending && !error && !unchanged;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    startTransition(async () => {
      const result = await renameAction(userPokemonId, value);
      if (result.ok) {
        toast.success("Nickname updated");
        onRenamed();
        setOpen(false);
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Rename ${nickname}`}
        onClick={() => {
          setValue(nickname);
          setOpen(true);
        }}
        className="inline-flex size-7 shrink-0 cursor-pointer items-end justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-amber-800">
              Rename
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                name="nickname"
                value={value}
                maxLength={MAX_NICKNAME_LENGTH}
                autoFocus
                aria-invalid={error ? true : undefined}
                onChange={(event) => setValue(event.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button
              type="submit"
              disabled={!canSave}
              className="w-full sm:w-auto"
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
