import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

    const variants = {
      default:
        "bg-neutral-950 text-white hover:bg-neutral-800 rounded-xl",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 rounded-xl",
      outline:
        "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 rounded-xl",
      secondary:
        "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 rounded-xl",
      ghost:
        "hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 rounded-xl",
      link:
        "text-neutral-900 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-xl px-8 text-base",
      icon: "h-9 w-9 p-0 rounded-xl",
    };

    const combinedClassName = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child =
        children as React.ReactElement<{
          className?: string;
        }>;

      return React.cloneElement(
        child,
        {
          ...props,
          className: cn(
            combinedClassName,
            child.props.className,
          ),
        } as Partial<typeof child.props>,
      );
    }

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };