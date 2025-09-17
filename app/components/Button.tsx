import React from 'react';

type ButtonVariant = 'run' | 'clear' | 'clear-user' | 'log';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  children: React.ReactNode;
}

/**
 * Renders a native <button> element with a variant-based CSS class.
 *
 * The `variant` prop is used to generate a class name of the form `button-{variant}` which is combined
 * with any provided `className`. All other props are spread onto the underlying <button>, allowing
 * standard HTML button attributes (e.g., `onClick`, `type`, `disabled`) to be passed through.
 *
 * @param variant - One of the predefined variant keys; used to form the `button-{variant}` CSS class.
 * @param className - Optional additional CSS class names to append to the variant class.
 * @param children - Content rendered inside the button.
 * @returns A JSX button element with the computed className and forwarded props.
 */
export function Button({ variant, children, className = '', ...props }: ButtonProps) {
  const variantClass = `button-${variant}`;
  const classes = `${variantClass} ${className}`.trim();

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}