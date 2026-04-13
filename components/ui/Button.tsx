"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "warm" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  as?: "button";
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: "9999px",
    boxShadow: "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px",
  },
  secondary: {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "9999px",
    boxShadow: "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px",
  },
  warm: {
    backgroundColor: "rgba(245,242,239,0.8)",
    color: "#000",
    borderRadius: "30px",
    boxShadow: "rgba(78,50,23,0.04) 0px 6px 16px",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#4e4e4e",
    borderRadius: "8px",
  },
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1 text-[13px]",
  md: "px-4 py-[7px] text-[15px]",
  lg: "px-5 py-[10px] text-[15px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", style, children, ...props }, ref) => {
    const variantStyle = styles[variant];

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium cursor-pointer transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
        style={{
          letterSpacing: "0.15px",
          border: "none",
          ...variantStyle,
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
