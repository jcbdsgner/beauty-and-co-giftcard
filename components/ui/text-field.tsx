import { cn } from "@/lib/utils";

// Padding/text scale matches the hero's `size="lg"` Button (see button.tsx),
// so typed fields carry the same visual weight as the homepage's big CTAs.
const base =
  "w-full border border-[var(--brand-color-1)] bg-white text-[var(--on-core-brand-color)] outline-none transition focus:border-[var(--button-2-color)] px-6 py-4 text-xl sm:px-8 sm:py-6 sm:text-2xl";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string };

export function TextField({ className, prefix, ...props }: TextFieldProps) {
  if (!prefix) {
    return <input className={cn(base, "rounded-full", className)} {...props} />;
  }

  return (
    // className (e.g. a grid item's `sm:col-span-2`) goes on this wrapper, not the
    // input — this div, not the input, is the actual grid item in a form's grid
    // layout, so a layout class applied to the input instead has no effect on it.
    <div className={cn("relative w-full", className)}>
      <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-xl text-[var(--text-secondary)] sm:left-8 sm:text-2xl">
        {prefix}
      </span>
      <input className={cn(base, "rounded-full pl-[4.5rem] sm:pl-[5.5rem]")} {...props} />
    </div>
  );
}

type TextAreaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ className, ...props }: TextAreaFieldProps) {
  return <textarea className={cn(base, "rounded-3xl", className)} {...props} />;
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ className, children, ...props }: SelectFieldProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(base, "appearance-none rounded-full pr-12 sm:pr-14", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[var(--on-core-brand-color)] sm:right-6 sm:size-6"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
