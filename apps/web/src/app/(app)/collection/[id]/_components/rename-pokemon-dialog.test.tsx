// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/(app)/collection/actions", () => ({ renameAction: vi.fn() }));

import { toast } from "sonner";
import { renameAction } from "@/app/(app)/collection/actions";
import { RenamePokemonDialog } from "./rename-pokemon-dialog";

const mockRename = renameAction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

function renderDialog(onRenamed: () => void = vi.fn()) {
  render(
    <RenamePokemonDialog
      userPokemonId="up-1"
      nickname="Pikachu"
      onRenamed={onRenamed}
    />,
  );
  return onRenamed;
}

describe("RenamePokemonDialog", () => {
  it("opens the dialog seeded with the current nickname", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /rename pikachu/i }));

    expect(await screen.findByLabelText(/nickname/i)).toHaveValue("Pikachu");
  });

  it("keeps Save disabled while the nickname is unchanged", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /rename pikachu/i }));
    await screen.findByLabelText(/nickname/i);

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("submits the new nickname, fires onRenamed, and toasts success", async () => {
    const user = userEvent.setup();
    mockRename.mockResolvedValue({ ok: true });
    const onRenamed = renderDialog();

    await user.click(screen.getByRole("button", { name: /rename pikachu/i }));
    const input = await screen.findByLabelText(/nickname/i);
    await user.clear(input);
    await user.type(input, "Sparky");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockRename).toHaveBeenCalledWith("up-1", "Sparky");
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onRenamed).toHaveBeenCalled();
  });

  it("shows an error toast when the rename fails", async () => {
    const user = userEvent.setup();
    mockRename.mockResolvedValue({
      ok: false,
      error: {
        type: "VALIDATION",
        code: "INVALID_NICKNAME",
        message: "Nickname is required",
      },
    });
    renderDialog();

    await user.click(screen.getByRole("button", { name: /rename pikachu/i }));
    const input = await screen.findByLabelText(/nickname/i);
    await user.clear(input);
    await user.type(input, "Sparky");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Nickname is required"),
    );
  });
});
