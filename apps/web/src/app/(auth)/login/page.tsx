"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginAction } from "./actions";
import { validateRequired } from "../validation";
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

export default function LoginPage() {
  const [serverError, action, pending] = useActionState(loginAction, null);
  const [values, setValues] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const emailError = validateRequired(values.email, "Email");
  const passwordError = validateRequired(values.password, "Password");

  const visibleEmailError = touched.email ? emailError : null;
  const visiblePasswordError = touched.password ? passwordError : null;

  return (
    <Card className="w-full max-w-sm py-6 shadow-xl">
      <CardHeader className="px-6 text-center">
        <CardTitle className="text-2xl">Welcome back!</CardTitle>
        <CardDescription>Sign in to check on your Pokémon team</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form
          action={action}
          onSubmit={(e) => {
            setTouched({ email: true, password: true });
            if (emailError || passwordError) {
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10"
                value={values.password}
                onChange={(e) =>
                  setValues((v) => ({ ...v, password: e.target.value }))
                }
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={visiblePasswordError ? true : undefined}
                aria-describedby={
                  visiblePasswordError ? "password-error" : undefined
                }
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
            {visiblePasswordError && (
              <p id="password-error" className="text-sm text-destructive">
                {visiblePasswordError}
              </p>
            )}
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? "Logging in…" : "Login"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
