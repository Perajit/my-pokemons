// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./actions", () => ({ updateProfileAction: vi.fn() }));

import { toast } from "sonner";
import { updateProfileAction } from "./actions";
import { ProfileForm } from "./profile-form";
import { setup } from "@/test/render";

const mockUpdate = updateProfileAction as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfileForm", () => {
  it("seeds the input with the current name", () => {
    setup(<ProfileForm initialName="Ash" />);
    expect(screen.getByLabelText(/display name/i)).toHaveValue("Ash");
  });

  it("keeps Save disabled until the name actually changes", () => {
    setup(<ProfileForm initialName="Ash" />);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("shows a validation error and keeps Save disabled when cleared", async () => {
    const { user } = setup(<ProfileForm initialName="Ash" />);

    await user.clear(screen.getByLabelText(/display name/i));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("does not submit an unchanged name via Enter", async () => {
    const { user } = setup(<ProfileForm initialName="Ash" />);

    await user.type(screen.getByLabelText(/display name/i), "{Enter}");

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("submits the new name and shows a success toast", async () => {
    mockUpdate.mockResolvedValue({ ok: true, data: { user: {} } });
    const { user } = setup(<ProfileForm initialName="Ash" />);

    const input = screen.getByLabelText(/display name/i);
    await user.clear(input);
    await user.type(input, "Misty");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockUpdate).toHaveBeenCalledWith("Misty");
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("shows an error toast when the update fails", async () => {
    mockUpdate.mockResolvedValue({
      ok: false,
      error: {
        type: "VALIDATION",
        code: "INVALID_NAME",
        message: "Name taken",
      },
    });
    const { user } = setup(<ProfileForm initialName="Ash" />);

    const input = screen.getByLabelText(/display name/i);
    await user.clear(input);
    await user.type(input, "Misty");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name taken"));
  });
});
