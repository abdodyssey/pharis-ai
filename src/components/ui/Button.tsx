"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon } from "@hugeicons/core-free-icons";
import React from "react";

/**
 * Button: A high-performance, accessible UI building block.
 * Implements Fitts's Law (sized hit targets) and Peak-End Rule (feedback).
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 hover:bg-slate-800 dark:hover:bg-white shadow-xl shadow-slate-200 dark:shadow-accent-lime/10",
      secondary: "bg-slate-50 dark:bg-obsidian-1 text-slate-950 dark:text-slate-100 border border-slate-200 dark:border-obsidian-2 hover:bg-slate-100 dark:hover:bg-obsidian-2",
      outline: "border-2 border-slate-200 dark:border-obsidian-2 bg-transparent text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-obsidian-2 shadow-sm",
      ghost: "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-2 hover:text-slate-900 dark:hover:text-slate-100",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-red-900/20",
    };

    const sizes = {
      sm: "px-4 py-2 text-[11px] font-black tracking-tight",
      md: "px-6 py-3 text-[13px] font-bold tracking-tight",
      lg: "px-8 py-4 text-base font-bold",
      xl: "px-10 py-6 text-xl font-extrabold tracking-tighter", 
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-3 rounded-xl transition-all duration-200 active:scale-[0.97] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed select-none outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <HugeiconsIcon icon={Loading01Icon} className="w-5 h-5 animate-spin opacity-60" />
        ) : (
          <>
            {leftIcon && <span className="group-hover:-translate-x-0.5 transition-transform">{leftIcon}</span>}
            <span className="leading-tight shrink-0">{children}</span>
            {rightIcon && <span className="group-hover:translate-x-0.5 transition-transform">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
