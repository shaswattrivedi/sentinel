import React from "react";
import { motion } from "framer-motion";
import { ZoneData, ZoneStatusLevel } from "@/types/ml";

interface CameraFeedPanelProps {
  annotatedFrames: { "zone-1": string | null; "zone-2": string | null };
  zoneData: { "zone-1": ZoneData; "zone-2": ZoneData };
  zoneStatus: { "zone-1": ZoneStatusLevel; "zone-2": ZoneStatusLevel };
}

const statusBorderColor: Record<ZoneStatusLevel, string> = {
  SAFE: "#22c55e",
  MODERATE: "#eab308",
  CRITICAL: "#ef4444",
};

const FeedTile: React.FC<{
  zoneId: "zone-1" | "zone-2";
  frame: string | null;
  peopleCount: number;
  status: ZoneStatusLevel;
}> = ({ zoneId, frame, peopleCount, status }) => {
  const zoneLabel = zoneId === "zone-1" ? "ZONE 1" : "ZONE 2";
  const borderColor = statusBorderColor[status];

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        minHeight: 350,
        borderRadius: 12,
        border: `1px solid color-mix(in srgb, ${borderColor} 85%, transparent)`,
        boxShadow: `0 10px 26px color-mix(in srgb, ${borderColor} 18%, transparent)`,
        background: "rgba(2, 6, 23, 0.78)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 3 }}>
        <div
          style={{
            borderRadius: 999,
            padding: "5px 10px",
            color: "#f8fafc",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.45,
            background: "rgba(0, 0, 0, 0.38)",
            border: "1px solid rgba(255,255,255,0.24)",
          }}
        >
          {zoneLabel} • {peopleCount} people
        </div>
      </div>

      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }}>
        <motion.div
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            borderRadius: 999,
            padding: "5px 10px",
            color: "#f8fafc",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            background: "rgba(0, 0, 0, 0.38)",
            border: "1px solid rgba(255,255,255,0.24)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 10px #ef4444",
            }}
          />
          LIVE
        </motion.div>
      </div>

      {frame ? (
        <img
          src={`data:image/jpeg;base64,${frame}`}
          alt={`${zoneLabel} annotated live feed`}
          style={{ width: "100%", height: "100%", flex: 1, objectFit: "contain", display: "block", background: "#000" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            flex: 1,
            display: "grid",
            placeItems: "center",
            color: "rgba(248, 250, 252, 0.68)",
            background:
              "radial-gradient(circle at 25% 25%, rgba(56,189,248,0.08), transparent 45%), radial-gradient(circle at 75% 75%, rgba(244,63,94,0.08), transparent 45%), rgba(2,6,23,0.85)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.35,
            textAlign: "center",
            padding: 16,
          }}
        >
          {zoneLabel} • Awaiting Feed...
        </div>
      )}
    </div>
  );
};

export const CameraFeedPanel: React.FC<CameraFeedPanelProps> = ({ annotatedFrames, zoneData, zoneStatus }) => {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      <FeedTile
        zoneId="zone-1"
        frame={annotatedFrames["zone-1"]}
        peopleCount={zoneData["zone-1"].cam_people_count}
        status={zoneStatus["zone-1"]}
      />

      <FeedTile
        zoneId="zone-2"
        frame={annotatedFrames["zone-2"]}
        peopleCount={zoneData["zone-2"].cam_people_count}
        status={zoneStatus["zone-2"]}
      />
    </div>
  );
};
