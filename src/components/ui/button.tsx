import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-geist text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focused-border-color disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background border-foreground hover:bg-background hover:text-foreground hover:border-focused-border-color",
        secondary:
          "bg-background text-foreground border-unfocused-border-color hover:border-focused-border-color",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-background hover:border-unfocused-border-color",
      },
      size: {
        default: "h-10 px-geist-half",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

