import React from "react";

export const Skeleton: React.FC<{ width?: number | string; height?: number | string; radius?: number }> = ({
  width = "100%",
  height = 16,
  radius = 8
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
        backgroundSize: "200% 100%",
        animation: "sentinel-skeleton 1.2s ease-in-out infinite"
      }}
    />
  );
};
