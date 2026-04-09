import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type PrimaryLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    variant?: "ghost" | "primary";
  };

const PrimaryLink = ({
  children,
  className,
  variant = "primary",
  ...linkProps
}: PrimaryLinkProps) => {
  const variantClassName =
    variant === "primary" ? "button-link--primary" : "button-link--ghost";
  const resolvedClassName = ["button-link", variantClassName, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={resolvedClassName} {...linkProps}>
      {children}
    </Link>
  );
};

export { PrimaryLink };
