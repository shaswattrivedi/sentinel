import React from "react";
import { motion } from "framer-motion";

type Props = {
  annotatedFrame: string | null;
  peopleCount: number;
  zoneStatus: string;
};

const zoneColorMap: Record<string, string> = {
  SAFE: "#22c55e",
  MODERATE: "#eab308",
  CRITICAL: "#ef4444",
  UNKNOWN: "#64748b"
};

export const CameraFeedPanel: React.FC<Props> = ({ annotatedFrame, peopleCount, zoneStatus }) => {
  const normalizedStatus = String(zoneStatus || "UNKNOWN").toUpperCase();
  const borderColor = zoneColorMap[normalizedStatus] ?? zoneColorMap.UNKNOWN;
  const isCritical = normalizedStatus === "CRITICAL";

  return (
    <div
      className="glass-card"
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid color-mix(in srgb, ${borderColor} 50%, transparent)`,
        boxShadow: `0 18px 48px color-mix(in srgb, ${borderColor} 18%, transparent)`
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4 }}>
        <motion.div
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 999,
            padding: "5px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 10px #ef4444"
            }}
          />
          <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: 11, letterSpacing: 1.2 }}>LIVE</span>
        </motion.div>
      </div>

      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 999,
            padding: "6px 12px",
            color: "#f8fafc",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4
          }}
        >
          Zone 1 • {peopleCount} people detected
        </div>
      </div>

      {isCritical && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#fecaca",
            fontWeight: 700,
            fontSize: 12,
            background: "rgba(127, 29, 29, 0.4)",
            border: "1px solid rgba(239,68,68,0.45)",
            borderRadius: 999,
            padding: "5px 10px"
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 10px #ef4444"
            }}
          />
          CRITICAL
        </motion.div>
      )}

      {annotatedFrame ? (
        <img
          src={`data:image/jpeg;base64,${annotatedFrame}`}
          alt="Zone 1 annotated live feed"
          style={{
            width: "100%",
            minHeight: 280,
            maxHeight: 420,
            objectFit: "cover",
            display: "block",
            background: "#020617"
          }}
        />
      ) : (
        <div
          style={{
            minHeight: 300,
            display: "grid",
            placeItems: "center",
            color: "rgba(248, 250, 252, 0.65)",
            background:
              "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.08), transparent 45%), radial-gradient(circle at 80% 80%, rgba(239,68,68,0.08), transparent 45%), rgba(2,6,23,0.7)",
            textAlign: "center",
            padding: 20,
            fontWeight: 600,
            letterSpacing: 0.3
          }}
        >
          Awaiting Zone 1 Camera Feed...
        </div>
      )}
    </div>
  );
};
