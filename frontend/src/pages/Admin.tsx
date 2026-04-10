import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchAllSimulationStatuses,
  fetchScenarios,
  Scenario,
  SimulationStatus,
  startSimulation,
  stopSimulation
} from "@/api/admin";
import { useAuth } from "@/context/AuthContext";

const pillBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  borderRadius: 9999,
  border: "1px solid rgba(177, 158, 239, 0.18)",
  background: "rgba(11, 10, 21, 0.7)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  boxShadow:
    "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
  width: "fit-content",
  color: "#f8fafc",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: "uppercase"
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#ffffff",
  fontSize: 13,
  width: "100%",
  outline: "none"
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 0.8,
  color: "rgba(255, 255, 255, 0.55)",
  marginBottom: 8,
  textTransform: "uppercase",
  fontWeight: 700
};

const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [statuses, setStatuses] = useState<SimulationStatus[]>([]);
  const [orgId, setOrgId] = useState<string>("org_1");
  const [scenario, setScenario] = useState<number>(1);
  const [durationInput, setDurationInput] = useState<string>("60");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const runningStatuses = useMemo(() => statuses.filter((s) => s.running), [statuses]);

  const statusByOrg = useMemo(() => {
    const map = new Map<string, SimulationStatus>();
    for (const status of runningStatuses) {
      map.set(status.orgId.trim().toLowerCase(), status);
    }
    return map;
  }, [runningStatuses]);

  const normalizedOrg = orgId.trim().toLowerCase();
  const targetStatus = statusByOrg.get(normalizedOrg);
  const isRunningForTargetOrg = Boolean(targetStatus?.running);

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      setLoading(true);
      setError("");
      try {
        const [scenarioList, statusList] = await Promise.all([fetchScenarios(), fetchAllSimulationStatuses()]);
        if (!active) return;

        setScenarios(scenarioList);
        setStatuses(statusList);
        if (scenarioList.length > 0) {
          setScenario((prev) => (scenarioList.some((s) => s.id === prev) ? prev : scenarioList[0].id));
        }
      } catch (loadError: any) {
        if (!active) return;
        setError(loadError?.response?.data?.error?.message || loadError?.message || "Failed to load admin data");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchAllSimulationStatuses()
        .then((list) => setStatuses(list))
        .catch(() => {
          // Keep panel resilient during temporary network errors.
        });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const handleStart = async () => {
    const trimmedOrg = orgId.trim();
    if (!trimmedOrg) {
      setError("Target org ID is required.");
      return;
    }

    const normalizedDuration = durationInput.trim() === "" ? "60" : durationInput.trim();
    const parsedDuration = Number(normalizedDuration);
    if (!Number.isFinite(parsedDuration) || !Number.isInteger(parsedDuration)) {
      setError("Duration must be a whole number between 10 and 300 seconds.");
      return;
    }
    if (parsedDuration < 10 || parsedDuration > 300) {
      setError("Duration must be between 10 and 300 seconds.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await startSimulation(trimmedOrg, scenario, parsedDuration);
      const latest = await fetchAllSimulationStatuses();
      setStatuses(latest);
      setDurationInput(String(parsedDuration));
      setMessage(`Simulation started for ${trimmedOrg}.`);
    } catch (startError: any) {
      setError(startError?.response?.data?.error?.message || startError?.message || "Failed to start simulation");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    const trimmedOrg = orgId.trim();
    if (!trimmedOrg) {
      setError("Target org ID is required.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await stopSimulation(trimmedOrg);
      const latest = await fetchAllSimulationStatuses();
      setStatuses(latest);
      setMessage(`Simulation stopped for ${trimmedOrg}.`);
    } catch (stopError: any) {
      setError(stopError?.response?.data?.error?.message || stopError?.message || "Failed to stop simulation");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: 1600,
        margin: "0 auto",
        width: "100%",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        fontFamily: "var(--font-dashboard)",
        color: "#f8fafc"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          width: "100%",
          padding: "18px 22px",
          borderRadius: 24,
          background: "rgba(11, 10, 21, 0.7)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid rgba(177, 158, 239, 0.18)",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              color: "#f8fafc",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 1,
              fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif"
            }}
          >
            SENTINEL Admin
          </div>
          <div style={{ color: "rgba(248, 250, 252, 0.72)", fontSize: 13 }}>
            Simulator control panel - SENTINELADMINUNIQUE access only
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div
            style={{
              ...pillBadgeStyle,
              background: "rgba(127, 29, 29, 0.32)",
              border: "1px solid rgba(248, 113, 113, 0.45)",
              color: "#fecaca"
            }}
          >
            <span style={{ color: "#f87171" }}>●</span>
            ADMIN MODE
          </div>
          <div style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-ui)"
          }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 24px",
              borderRadius: 9999,
              background: "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)",
              border: "1px solid rgba(177, 158, 239, 0.35)",
              color: "#f8fafc",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s",
              fontFamily: "var(--font-ui)"
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {(error || message) && (
        <div
          className="glass-card"
          style={{
            padding: "10px 14px",
            borderColor: error ? "rgba(248, 113, 113, 0.45)" : "rgba(52, 211, 153, 0.35)",
            color: error ? "#fecaca" : "#bbf7d0"
          }}
        >
          {error || message}
        </div>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...pillBadgeStyle, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            SIMULATION CONTROL
          </div>

          <div>
            <div style={labelStyle}>Target Org ID</div>
            <input
              type="text"
              placeholder="e.g. SYMBIOSIS, SUHRC, org_1"
              value={orgId}
              onChange={(event) => setOrgId(event.target.value)}
              style={inputStyle}
              onFocus={(event) => (event.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.5)")}
              onBlur={(event) => (event.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.10)")}
            />
          </div>

          <div>
            <div style={labelStyle}>Scenario</div>
            <select
              value={scenario}
              onChange={(event) => setScenario(Number(event.target.value))}
              style={inputStyle}
              disabled={loading || scenarios.length === 0}
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id} style={{ background: "#111827", color: "#f8fafc" }}>
                  Scenario {item.id} - {item.name}: {item.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Duration (seconds)</div>
            <input
              type="number"
              min={10}
              max={300}
              value={durationInput}
              onChange={(event) => {
                setDurationInput(event.target.value);
                if (error) setError("");
              }}
              onBlur={() => {
                const trimmed = durationInput.trim();
                if (!trimmed) {
                  setDurationInput("60");
                  return;
                }
                const parsed = Number(trimmed);
                if (!Number.isFinite(parsed)) {
                  setDurationInput("60");
                  return;
                }
                const clamped = Math.max(10, Math.min(300, Math.round(parsed)));
                setDurationInput(String(clamped));
              }}
              style={inputStyle}
            />
          </div>

          <button
            onClick={isRunningForTargetOrg ? handleStop : handleStart}
            disabled={busy || loading}
            style={{
              marginTop: 6,
              borderRadius: 999,
              border: isRunningForTargetOrg ? "1px solid rgba(248, 113, 113, 0.45)" : "1px solid rgba(74, 222, 128, 0.4)",
              background: isRunningForTargetOrg ? "rgba(127, 29, 29, 0.35)" : "rgba(22, 101, 52, 0.35)",
              color: isRunningForTargetOrg ? "#fecaca" : "#bbf7d0",
              padding: "11px 16px",
              fontWeight: 700,
              letterSpacing: 0.5,
              fontSize: 13,
              transition: "all 0.2s",
              fontFamily: "var(--font-ui)"
            }}
          >
            {busy ? "Working..." : isRunningForTargetOrg ? "⏹ STOP SIMULATION" : "▶ START SIMULATION"}
          </button>

          <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.6 }}>
            Simulation posts to ML service every 1.5s with the target org's data context. The target org's dashboard
            will update in real-time.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 300 }}>
          <div style={{ ...pillBadgeStyle, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 8px #f97316" }} />
            ACTIVE SIMULATIONS
          </div>

          {runningStatuses.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.3)",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 12,
                minHeight: 200
              }}
            >
              No active simulations
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {runningStatuses.map((status) => {
                const elapsed = Math.max(0, status.elapsed ?? 0);
                const durationSec = Math.max(1, status.duration ?? 1);
                const progress = Math.min(100, (elapsed / durationSec) * 100);

                return (
                  <div
                    key={`${status.orgId}-${status.scenario}-${status.startedAt ?? ""}`}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      padding: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 14 }}>{status.orgId}</div>
                      <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, letterSpacing: 0.6 }}>
                        <span style={{ marginRight: 4 }}>●</span>RUNNING
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "rgba(249, 115, 22, 0.18)",
                          border: "1px solid rgba(249, 115, 22, 0.35)",
                          color: "#fdba74",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          textTransform: "uppercase"
                        }}
                      >
                        {status.scenarioName || `Scenario ${status.scenario ?? "-"}`}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Tick: {status.tick ?? 0}</span>
                    </div>

                    <div>
                      <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "#f97316",
                            borderRadius: 999,
                            transition: "width 0.2s ease"
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 4, textAlign: "right", color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                        {elapsed}s / {durationSec}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="glass-card" style={{ borderLeft: "4px solid #f97316", padding: "20px 24px" }}>
        <div style={{ ...pillBadgeStyle, fontSize: 12, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 8px #f97316" }} />
          HOW THIS WORKS
        </div>
        <p style={{ margin: 0, color: "rgba(248,250,252,0.85)", lineHeight: 1.6, fontSize: 15 }}>
          Simulations inject synthetic crowd telemetry into the ML service on behalf of the selected organization. The
          target org's live dashboard updates in real-time as if real hardware were reporting. Use this to demo
          SENTINEL to clients or test org data isolation.
        </p>
      </section>
    </div>
  );
};

export default Admin;
