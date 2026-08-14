import { cn } from "@/lib/utils";

// Padding/text scale matches the hero's `size="lg"` Button (see button.tsx),
// so typed fields carry the same visual weight as the homepage's big CTAs.
const base =
  "w-full border border-[var(--brand-color-1)] bg-white text-[var(--on-core-brand-color)] outline-none transition focus:border-[var(--button-2-color)] px-6 py-4 text-xl sm:px-8 sm:py-6 sm:text-2xl";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className, ...props }: TextFieldProps) {
  return <input className={cn(base, "rounded-full", className)} {...props} />;
}

type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ className, ...props }: TextAreaFieldProps) {
  return <textarea className={cn(base, "rounded-3xl", className)} {...props} />;
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ className, children, ...props }: SelectFieldProps) {
  return (
    <select className={cn(base, "rounded-full", className)} {...props}>
      {children}
    </select>
  );
}
