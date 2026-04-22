import type { CSSProperties, ReactNode } from "react";

type SectionLabelProps = {
  children: ReactNode;
  style?: CSSProperties;
};

export default function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <div className="sec-label" style={style}>
      {children}
    </div>
  );
}
