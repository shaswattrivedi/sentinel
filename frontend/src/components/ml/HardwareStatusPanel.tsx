import React from "react";
import { HardwareStatusResponse, HardwareCommands } from "@/types/ml";
import { Skeleton } from "@/components/ml/Skeleton";

type Props = {
  hardware: HardwareStatusResponse | null;
  loading?: boolean;
};

export const HardwareStatusPanel: React.FC<Props> = ({ hardware, loading }) => {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 16 }}>
        <Skeleton height={120} />
      </div>
    );
  }

  if (!hardware) {
    return (
      <div className="glass-card" style={{ padding: 16, color: "#f8fafc" }}>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
          TRAFFIC SIGNALS
        </div>
        <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: 15 }}>Hardware data unavailable</div>
      </div>
    );
  }

  const zones = ["z2", "z3"] as const;
  const evacBuzzerActive = hardware.hardware_commands?.z2_buzzer || hardware.hardware_commands?.z3_buzzer;

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ color: "rgba(248, 250, 252, 0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>
        TRAFFIC SIGNALS
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {zones.map((zone) => {
          const ledStr = hardware.hardware_commands?.[`${zone}_led` as keyof HardwareCommands];
          const isSafe = ledStr === "green" || !ledStr;
          const ledRColor = isSafe ? "rgba(255,255,255,0.05)" : "var(--color-critical)";
          const ledGColor = isSafe ? "var(--color-safe)" : "rgba(255,255,255,0.05)";
          
          return (
            <div key={`hw-${zone}`} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 12, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>{zone.toUpperCase()} LEDs</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: ledRColor,
                  border: `2px solid color-mix(in srgb, ${ledRColor} 40%, transparent)`,
                  boxShadow: !isSafe ? `0 0 12px ${ledRColor}` : "none",
                  transition: "all 0.3s"
                }} title={`${zone} Red LED`} />
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: ledGColor,
                  border: `2px solid color-mix(in srgb, ${ledGColor} 40%, transparent)`,
                  boxShadow: isSafe ? `0 0 12px ${ledGColor}` : "none",
                  transition: "all 0.3s"
                }} title={`${zone} Green LED`} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "rgba(248, 250, 252, 0.7)", fontSize: 12, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>EVAC BUZZER</div>
          <div style={{ color: evacBuzzerActive ? "var(--color-critical)" : "var(--color-safe)", fontSize: 14, fontWeight: 800, marginTop: 4, letterSpacing: "1px" }}>
            {evacBuzzerActive ? "ACTIVE" : "STANDBY"}
          </div>
        </div>
        <div style={{ width: 44, height: 24, borderRadius: 12, background: evacBuzzerActive ? "var(--color-critical)" : "rgba(255,255,255,0.1)", position: "relative" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 2, left: evacBuzzerActive ? 22 : 2, transition: "all 0.3s"
          }} />
        </div>
      </div>
    </div>
  );
};
