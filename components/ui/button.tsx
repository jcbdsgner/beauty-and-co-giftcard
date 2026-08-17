import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "brand" | "outline" | "gradient" | "lilac";

const variants: Record<Variant, string> = {
  brand:
    "bg-[var(--core-brand-color,#fdcfca)] text-black shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:opacity-90",
  outline:
    "bg-white border border-[var(--brand-color-1,rgba(216,184,180,0.5))] text-[var(--button-2-color,#a27576)] hover:bg-[#f5f5f5]",
  gradient:
    "bg-gradient-to-r from-[#fead40] via-[#fe6020] via-[31.5%] to-[#f6017f] to-[89.5%] text-white hover:opacity-90",
  lilac:
    "bg-[var(--brand-lilac,#e4c8ff)] text-[var(--text-secondary,#344054)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:opacity-90",
};

type Size = "default" | "lg";

const sizes: Record<Size, string> = {
  default: "gap-2 px-4 py-3 text-[17px]",
  lg: "gap-3 px-6 py-4 text-xl sm:gap-4 sm:px-8 sm:py-6 sm:text-[34px]",
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-[450] transition active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#e9e4e3] disabled:text-[#a3a3a3] disabled:shadow-none disabled:border-transparent disabled:active:scale-100";

type CommonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  /** Set when href leaves this site (a separate Beauty and Co property). Opens in a new tab and shows an external-link cue so the user knows they're navigating away. */
  external?: boolean;
  /** Hide the external-link arrow cue even when `external` is set (target/rel still apply). */
  hideExternalIcon?: boolean;
};

type ActionButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export type ButtonProps = LinkButtonProps | ActionButtonProps;

export function Button(props: ButtonProps) {
  const { children, icon, variant = "brand", size = "default", className } = props;
  const classes = cn(base, sizes[size], variants[variant], className);

  if (props.href) {
    const { href, external = false, hideExternalIcon = false } = props;
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {icon}
        {children}
        {external && !hideExternalIcon && (
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            className="size-4 shrink-0"
          >
            <path
              d="M7 13L13 7M13 7H8M13 7V12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stripped so they aren't spread onto the DOM button
  const {
    href,
    variant: _variant,
    size: _size,
    className: _cn,
    icon: _icon,
    children: _children,
    type = "button",
    ...buttonRest
  } = props as ActionButtonProps;

  return (
    <button type={type} className={classes} {...buttonRest}>
      {icon}
      {children}
    </button>
  );
}
