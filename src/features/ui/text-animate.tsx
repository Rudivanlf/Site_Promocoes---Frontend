import React from "react";

type TextAnimateProps = React.PropsWithChildren<{
  className?: string;
  as?: React.ElementType; // <-- O erro foi corrigido nesta linha
  animation?: "blurIn";
}>;

export function TextAnimate({
  children,
  className = "",
  as = "span",
  animation = "blurIn",
}: TextAnimateProps) {
  const Comp: any = as;

  return (
    <Comp
      className={`inline-block align-baseline ${
        animation === "blurIn" ? "animate-textBlurIn" : ""
      } ${className}`}
      style={{
        overflow: "visible",
        lineHeight: 1.18,
        paddingBottom: "0.18em",
      }}
    >
      {children}
    </Comp>
  );
}