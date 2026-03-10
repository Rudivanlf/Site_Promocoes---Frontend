import React from "react";

type AuroraTextProps = React.PropsWithChildren<{
  className?: string;
  colors?: string[];
  speed?: number; 
  as?: React.ElementType; // <-- O erro foi corrigido nesta linha também
}>;

export function AuroraText({
  children,
  className = "",
  colors = ["#05C71F", "#00FF88", "#39FF14", "#05C71F"],
  speed = 1.1,
  as = "span",
}: AuroraTextProps) {
  const Comp: any = as;
  const gradient = `linear-gradient(90deg, ${colors.join(", ")})`;
  const duration = `${Math.max(4, 10 / Math.max(0.2, speed))}s`;

  return (
    <Comp
      className={`inline-block align-baseline ${className}`}
      style={{
        backgroundImage: gradient,
        backgroundSize: "300% 200%",
        backgroundPosition: "0% 50%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        overflow: "visible",
        lineHeight: 1.18,
        paddingBottom: "0.18em",
        animationName: "auroraMove",
        animationDuration: duration,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
        willChange: "background-position",
      }}
    >
      {children}
    </Comp>
  );
}