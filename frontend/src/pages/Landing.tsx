import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import problemInitial from "@/assets/problem-initial.png";
import problemStampedes from "@/assets/problem-stampedes.png";
import problemInjuries from "@/assets/problem-injuries.png";
import problemFire from "@/assets/problem-fire.png";
import problemPanic from "@/assets/problem-panic.png";
import sentinelMain from "@/assets/sentinel-main.png";
import TextType from "@/components/TextType";
import ShinyText from "@/components/ShinyText";

const SectionDivider: React.FC = () => (
  <div
    style={{
      height: 2,
      background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(177,158,239,0.3), rgba(255,255,255,0.08))",
      margin: "40px 0"
    }}
  />
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    className="glass-card"
    style={{
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      alignItems: "stretch",
      textAlign: "left"
    }}
  >
    <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16, textAlign: "center" }}>{title}</div>
    <div style={{ color: "rgba(248, 250, 252, 0.82)", fontSize: 15.5, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
  </div>
);

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const primaryCta = () => navigate(user ? "/dashboard" : "/login");
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const problemSlides = [
    {
      key: "overview",
      heading: "",
      body: "The ROOT Cause - SENTINEL addresses crowd risk before it escalates.",
      image: problemInitial
    },
    {
      key: "stampedes",
      heading: "",
      body: "STAMPEDES - Approx. 800 deaths/year; 2006–19 saw 11,000+ fatalities.",
      image: problemStampedes
    },
    {
      key: "injuries",
      heading: "",
      body: "INJURIES - India shows ~36% increase in injuries over 16 years.",
      image: problemInjuries
    },
    {
      key: "fire",
      heading: "",
      body: "FIRE DISASTERS - 15000–18000 injuries and 3000–4000 deaths annually.",
      image: problemFire
    },
    {
      key: "panic",
      heading: "",
      body: "PANIC - Delays and crowd surges keep risk high without early action.",
      image: problemPanic
    }
  ];

  const [problemIndex, setProblemIndex] = useState(0);
  const nextProblem = () => setProblemIndex((prev) => (prev + 1) % problemSlides.length);
  const prevProblem = () => setProblemIndex((prev) => (prev - 1 + problemSlides.length) % problemSlides.length);

  return (
    <div id="top" style={{ color: "#f8fafc", scrollBehavior: "smooth" }}>
      {/* Top Navigation Bar with brand */}
      <nav
        className="glass-card"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "25px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
          borderRadius: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <Link to="/" style={{ color: "#f8fafc", textDecoration: "none", fontSize: 50, fontWeight: 800, letterSpacing: 1 }}>
          SENTINEL
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginLeft: "auto" }}>
          {[
            { label: "Home", action: () => scrollTo("top") },
            { label: "Product", action: () => scrollTo("product-section") },
            { label: "Use Cases", action: () => scrollTo("use-cases") },
            { label: "Contact Us", action: () => scrollTo("contact") }
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                padding: "11px 11px",
                borderRadius: 8,
                border: "1px solid rgba(177, 158, 239, 0.25)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#f8fafc",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                minWidth: 112
              }}
            >
              {item.label}
            </button>
          ))}
          <Link
            to={user ? "/dashboard" : "/login"}
            style={{
              padding: "11px 11px",
              borderRadius: 8,
              border: "1px solid rgba(177, 158, 239, 0.25)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#f8fafc",
              textDecoration: "none",
              fontWeight: 600,
              minWidth: 112,
              textAlign: "center",
              display: "inline-block",
              fontSize: 15,
              whiteSpace: "nowrap"
            }}
          >Login to Dashboard</Link>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div style={{ height: 90 }} />

      <div style={{ maxWidth: 1350, margin: "0 auto", padding: "48px 20px 0" }}>
        {/* Section 3 — Project Identity + Vision Statement */}
        <section style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: 0.2 }}>
            <ShinyText
              text="What if evacuations were proactive, not reactive?"
              speed={2.6}
              spread={120}
              color="rgba(248, 250, 252, 0.72)"
              shineColor="#ffffff"
              pauseOnHover
              yoyo
            />
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "left", margin: "32px 0 48px" }}>
          <img
            src={sentinelMain}
            alt="SENTINEL platform overview"
            style={{
              width: "100%",
              maxWidth: 600,
              height: "auto",
              borderRadius: 14,
              boxShadow: "0 18px 38px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255, 255, 255, 0.02)"
            }}
          />
        </div>

        <div style={{ height: 240 }} />

      <SectionDivider />

      {/* Section 4 — Three Information Boxes */}
      <section id="product-section" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        <div style={{ fontSize: 48, fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
          <TextType
            text={["Why Crowd Safety Fails?", "Why Crowd Safety Fails?", "Why Crowd Safety Fails?"]}
            typingSpeed={70}
            pauseDuration={7000}
            deletingSpeed={70}
            showCursor={false}
            cursorCharacter="_"
            cursorBlinkDuration={0.6}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* The Problem carousel with paired graph */}
          <div
            style={{
              width: "100%",
              maxWidth: 1080,
              alignSelf: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: 50,
              alignItems: "stretch"
            }}
        >

            <div
              className="glass-card"
              style={{
                flex: "1 1 620px",
                minWidth: "min(640px, 100%)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, position: "relative" }}>
                <button
                  onClick={prevProblem}
                  aria-label="Previous"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    border: "1px solid rgba(177, 158, 239, 0.25)",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#f8fafc",
                    cursor: "pointer",
                    position: "absolute",
                    left: 0,
                    top: 0
                  }}
                >
                  <ChevronLeft size={25} />
                </button>
                <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 40, letterSpacing: 1 }}>THE PROBLEM</div>
                <button
                  onClick={nextProblem}
                  aria-label="Next"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    border: "1px solid rgba(177, 158, 239, 0.25)",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "#f8fafc",
                    cursor: "pointer",
                    position: "absolute",
                    right: 0,
                    top: 0
                  }}
                >
                  <ChevronRight size={25} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={problemSlides[problemIndex].key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: "rgba(248, 250, 252, 0.85)", fontSize: 22, lineHeight: 2.0 }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}><center>{problemSlides[problemIndex].heading}</center></div>
                  <div><center>{problemSlides[problemIndex].body}</center></div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div
              style={{
                flex: "1 1 320px",
                minWidth: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={problemSlides[problemIndex].image}
                  src={problemSlides[problemIndex].image}
                  alt={problemSlides[problemIndex].heading}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    aspectRatio: "2 / 1",
                    height: "auto",
                    objectFit: "cover",
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                    background: "transparent"
                  }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Current Solutions */}
          <div style={{ width: "100%", maxWidth: 720, alignSelf: "flex-end" }}>
            <Card title="Current Solutions">
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong>CCTV & Video:</strong> Broad coverage but delayed, manual, and weak at early anomaly detection.</li>
                <li><strong>People counting:</strong> Entry/exit totals but no flow direction or prediction, limited low-light insight.</li>
                <li><strong>AI video analytics:</strong> Detects/tracks yet costly, bandwidth-heavy, with decisions still manual.</li>
                <li><strong>Emergency evacuation software:</strong> Simulates routes, visualizes choke points, and tests designs, but not live-linked to IoT/crowd sensors and remains simulation-only during real incidents.</li>
              </ul>
            </Card>
          </div>

          {/* SENTINEL Advantage */}
          <div style={{ width: "100%", maxWidth: 720, alignSelf: "flex-start" }}>
            <Card title="SENTINEL's Advantage">
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong>Combined strengths:</strong> CCTV reach, counting precision, and analytics without blind spots.</li>
                <li><strong>Predictive intelligence:</strong> Flow-aware analysis plus automated evacuation guidance.</li>
                <li><strong>Cost efficiency:</strong> Distributed sensing delivers proactive prevention over reactive response.</li>
                <li><strong>Live-integrated response:</strong> Fuses simulations with real-time sensor data to update routes dynamically when conditions change.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Section 5 — Differentiators & Technology Overview */}
      <section id="detection-decision" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>From Detection to Decision</div>
      </section>

      <section className="glass-card" id="why" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>Why SENTINEL works</div>
        <div style={{ color: "rgba(248, 250, 252, 0.78)", fontSize: 15, lineHeight: 1.6, textAlign: "center" }}>
          SENTINEL blends distributed sensing (ESP32-CAM nodes) with ML-driven risk modeling to deliver real-time situational awareness. Predictive analytics flag crowd instability early, explainable safety decisions keep teams informed, and adaptive routing reduces congestion during evacuations. The system scales across venues, feeding continuous telemetry into proactive safeguards rather than relying on human reaction time.
        </div>
      </section>

      <SectionDivider />

      {/* Section 7 — Use Cases */}
      <section id="use-cases" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>Use Cases</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, alignItems: "stretch" }}>
          <Card title="Large Public Buildings">
            <div style={{ textAlign: "center" }}>
              Malls, airports, and convention centers rely on uninterrupted movement. SENTINEL keeps lobbies and corridors flowing, flags risky congestion early, and guides staff to respond before queues harden into blockages.
            </div>
          </Card>
          <Card title="Educational Institutions">
            <div style={{ textAlign: "center" }}>
              Campuses, schools, and exam halls juggle surges at bells and events. Real-time density sensing and predictive routing help disperse crowds, keep stairwells clear, and protect students during drills or incidents.
            </div>
          </Card>
          <Card title="Transportation Hubs">
            <div style={{ textAlign: "center" }}>
              Metro, rail, and bus terminals face peak-hour spikes and platform choke points. SENTINEL anticipates pressure zones, balances foot traffic across exits, and coordinates staff to prevent cascading delays.
            </div>
          </Card>
          <Card title="Event & Mass Gathering Venues">
            <div style={{ textAlign: "center" }}>
              Stadiums, concerts, and religious gatherings demand rapid, safe egress. The platform detects turbulence in crowd flow, issues targeted guidance, and aligns stewards to keep routes clear when emotions run high.
            </div>
          </Card>
        </div>
      </section>

      <SectionDivider />

      {/* Section 6 — Footer */}
      <footer
        id="contact"
        style={{
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
          marginTop: 32,
          padding: "42px 32px 48px",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255, 255, 255, 0.04)",
          color: "rgba(248, 250, 252, 0.82)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box"
        }}
      >
        <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span>© SENTINEL — All Rights Reserved</span>
            <span>contact@sentinel.ai</span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a href="#" style={{ color: "rgba(248, 250, 252, 0.72)", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: "rgba(248, 250, 252, 0.72)", textDecoration: "none" }}>Terms</a>
            <a href="#" style={{ color: "rgba(248, 250, 252, 0.72)", textDecoration: "none" }}>Security</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Landing;
