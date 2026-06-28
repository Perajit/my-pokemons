"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { registerAction } from "./actions";
import { checkPasswordRules, validateEmail } from "../validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [serverError, action, pending] = useActionState(registerAction, null);
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const emailError = validateEmail(values.email);
  const passwordRules = checkPasswordRules(values.password);
  const passwordValid = passwordRules.every((r) => r.met);

  const visibleEmailError = touched.email ? emailError : null;
  const passwordInvalidVisible = touched.password && !passwordValid;

  return (
    <Card className="w-full max-w-sm py-6 shadow-xl">
      <CardHeader className="px-6 text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Collect and care for your Pokémon team
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form
          action={action}
          onSubmit={(e) => {
            setTouched({ email: true, password: true });
            if (emailError || !passwordValid) {
              e.preventDefault();
            }
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name (optional)"
              autoComplete="name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) =>
                setValues((v) => ({ ...v, email: e.target.value }))
              }
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={visibleEmailError ? true : undefined}
              aria-describedby={visibleEmailError ? "email-error" : undefined}
            />
            {visibleEmailError && (
              <p id="email-error" className="text-sm text-destructive">
                {visibleEmailError}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password*</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create your password"
                autoComplete="new-password"
                required
                className="pr-10"
                value={values.password}
                onChange={(e) =>
                  setValues((v) => ({ ...v, password: e.target.value }))
                }
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={passwordInvalidVisible ? true : undefined}
                aria-describedby="password-requirements"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
            <ul
              id="password-requirements"
              aria-label="Password requirements"
              className="mt-1 space-y-0.5 text-sm"
            >
              {passwordRules.map((r) => (
                <li
                  key={r.key}
                  className={cn(
                    "flex items-center gap-1.5",
                    r.met ? "text-green-600" : "text-muted-foreground",
                  )}
                >
                  <span role="img" aria-label={r.met ? "met" : "not met"}>
                    {r.met ? "✓" : "○"}
                  </span>{" "}
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? "Creating account…" : "Register"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
