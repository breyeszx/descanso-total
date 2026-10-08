"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/form";

export function SubmitButton({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className} variant={variant}>
      {pending ? "Guardando..." : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p className={cn("text-sm", state.error ? "text-destructive" : "text-green-600")} role="status">
      {state.error ?? state.ok}
    </p>
  );
}

type FieldProps = {
  name: string;
  label: string;
  state?: FormState;
  className?: string;
  children?: React.ReactNode;
};

export function Field({ name, label, state, className, children }: FieldProps) {
  const err = state?.fields?.[name];
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

type InputFieldProps = FieldProps & React.ComponentProps<typeof Input>;

export function InputField({ name, label, state, className, defaultValue, ...props }: InputFieldProps) {
  return (
    <Field name={name} label={label} state={state} className={className}>
      <Input id={name} name={name} aria-invalid={!!state?.fields?.[name]} defaultValue={state?.values?.[name] ?? defaultValue} {...props} />
    </Field>
  );
}

export function TextareaField({ name, label, state, className, defaultValue, ...props }: FieldProps & React.ComponentProps<typeof Textarea>) {
  return (
    <Field name={name} label={label} state={state} className={className}>
      <Textarea id={name} name={name} defaultValue={state?.values?.[name] ?? defaultValue} {...props} />
    </Field>
  );
}

export function SelectField({ name, label, state, className, options, defaultValue, ...props }: FieldProps & React.ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <Field name={name} label={label} state={state} className={className}>
      <select
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}
