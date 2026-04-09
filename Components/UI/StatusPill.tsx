import type { ReactNode } from "react";

type StatusPillProps = {
  children: ReactNode;
  tone?: "danger" | "neutral" | "success" | "warning";
};

const StatusPill = ({
  children,
  tone = "neutral"
}: StatusPillProps) => {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      <span className="status-pill__dot" />
      {children}
    </span>
  );
};

export { StatusPill };
