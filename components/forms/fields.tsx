"use client";

import { useId, type ReactNode } from "react";
import { Controller, get, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * Form fields bound through react-hook-form's context. Each renders a label,
 * control and inline error, wired with aria-invalid / aria-describedby.
 */

interface BaseFieldProps {
  name: string;
  label: string;
  description?: string;
  className?: string;
  required?: boolean;
}

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const error = get(errors, name) as { message?: string } | undefined;
  return error?.message;
}

function FieldShell({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="text-muted-foreground">*</span> : null}
      </Label>
      {children}
      {description && !error ? (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, description?: string) {
  if (error) return `${id}-error`;
  if (description) return `${id}-description`;
  return undefined;
}

export const CONTROL_CLASS = "h-10 md:h-9";

export function TextField({
  name,
  label,
  description,
  className,
  required,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  autoFocus,
}: BaseFieldProps & {
  type?: "text" | "email" | "password" | "url" | "date" | "time" | "search";
  placeholder?: string;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "url";
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required} className={className}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, description)}
        aria-required={required}
        className={CONTROL_CLASS}
        {...register(name)}
      />
    </FieldShell>
  );
}

/** Numeric input kept as a string; the schema parses and validates it. */
export function NumberField({
  name,
  label,
  description,
  className,
  required,
  placeholder,
  suffix,
  integer = false,
}: BaseFieldProps & { placeholder?: string; suffix?: string; integer?: boolean }) {
  const id = useId();
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required} className={className}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, description)}
          aria-required={required}
          className={cn(CONTROL_CLASS, "tabular", suffix && "pr-14")}
          {...register(name)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function TextareaField({
  name,
  label,
  description,
  className,
  required,
  placeholder,
  rows = 3,
}: BaseFieldProps & { placeholder?: string; rows?: number }) {
  const id = useId();
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required} className={className}>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, description)}
        className="min-h-20 resize-y"
        {...register(name)}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  name,
  label,
  description,
  className,
  required,
  options,
  placeholder = "Select…",
  allowEmpty = false,
}: BaseFieldProps & { options: readonly SelectOption[]; placeholder?: string; allowEmpty?: boolean }) {
  const id = useId();
  const { control } = useFormContext();
  const error = useFieldError(name);
  const EMPTY = "__none__";
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={(field.value as string) || (allowEmpty ? EMPTY : undefined)}
            onValueChange={(v) => field.onChange(v === EMPTY ? "" : v)}
          >
            <SelectTrigger
              id={id}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy(id, error, description)}
              className={cn(CONTROL_CLASS, "w-full")}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowEmpty ? <SelectItem value={EMPTY}>None</SelectItem> : null}
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FieldShell>
  );
}

/** Native <select> for long option lists (e.g. timezones) — fast and mobile-friendly. */
export function NativeSelectField({
  name,
  label,
  description,
  className,
  required,
  options,
}: BaseFieldProps & { options: readonly SelectOption[] }) {
  const id = useId();
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <FieldShell id={id} label={label} description={description} error={error} required={required} className={className}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, description)}
        className={cn(
          CONTROL_CLASS,
          "w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 [&>option]:bg-popover",
        )}
        {...register(name)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function SwitchField({ name, label, description, className }: BaseFieldProps) {
  const id = useId();
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5", className)}>
          <div className="grid gap-0.5">
            <Label htmlFor={id}>{label}</Label>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
        </div>
      )}
    />
  );
}

export function CheckboxField({ name, label, className }: BaseFieldProps) {
  const id = useId();
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("flex items-center gap-2", className)}>
          <Checkbox id={id} checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(v === true)} ref={field.ref} />
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
        </div>
      )}
    />
  );
}

/** 1–5 segmented scale (mood / energy). Value stored as a string. */
export function ScaleField({
  name,
  label,
  labels,
  className,
}: BaseFieldProps & { labels: Record<number, string> }) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <fieldset className={cn("grid gap-1.5", className)}>
          <legend className="mb-1.5 text-sm font-medium">{label}</legend>
          <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = String(field.value) === String(n);
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${n} — ${labels[n] ?? ""}`}
                  onClick={() => field.onChange(selected ? "" : String(n))}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                    selected ? "border-brand bg-brand-soft text-foreground" : "hover:bg-muted",
                  )}
                >
                  <span className="font-semibold tabular">{n}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{labels[n]}</span>
                </button>
              );
            })}
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </fieldset>
      )}
    />
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
