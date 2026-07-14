import { forwardRef } from 'react';
import { cn } from './Button';

export const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border border-gray-100 dark:border-gray-800 bg-surface text-text-primary shadow-sm', className)}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-heading font-semibold leading-none tracking-tight text-secondary', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';
