import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "purple" | "outline";
  size?: "sm" | "md";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = "primary", size = "md", children, className = "", ...props }) => {
  const classes = ["btn", "btn-" + variant, size === "sm" ? "btn-sm" : "", className].filter(Boolean).join(" ");
  return <button className={classes} {...props}>{children}</button>;
};

export default Button;
