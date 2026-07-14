import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { forwardRef } from 'react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = forwardRef(({ className, variant = 'primary', size = 'default', isLoading, children, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary hover:bg-secondary text-white shadow-sm shadow-primary/20 border border-transparent',
    secondary: 'bg-surface hover:bg-gray-100 text-text-primary border border-gray-200 dark:border-gray-800 shadow-sm',
    outline: 'bg-transparent hover:bg-primary/5 text-primary border border-primary',
    danger: 'bg-error hover:bg-error/90 text-white shadow-sm border border-transparent',
    ghost: 'bg-transparent hover:bg-gray-100/50 text-text-primary',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
