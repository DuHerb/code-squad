import React from 'react';

type ButtonVariant = 'run' | 'clear' | 'clear-user' | 'log';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  children: React.ReactNode;
}

export function Button({ variant, children, className = '', ...props }: ButtonProps) {
  const variantClass = `button-${variant}`;
  const classes = `${variantClass} ${className}`.trim();

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}