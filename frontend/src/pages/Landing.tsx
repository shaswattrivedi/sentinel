import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import problemInitial from "@/assets/problem-initial.png";
import sentinelAdvantage from "@/assets/sentinel-advantage.png";
import sentinelMain from "@/assets/sentinel-main.png";
import sentinelBackdrop from "@/assets/sentinel-backdrop.png";
import TextType from "@/components/TextType";
import ShinyText from "@/components/ShinyText";
import SpotlightCard from "@/components/SpotlightCard";
import StatisticsCarousel from "@/components/StatisticsCarousel";
import type { StatSlide } from "@/components/StatisticsCarousel";
import SplitText from "@/components/SplitText";
import TiltedCard from "@/components/TiltedCard";
import ScrollFloat from "@/components/ScrollFloat";
import AboutUs from "@/components/AboutUs";
import problemStampedes from "@/assets/problem-stampedes.png";
import problemInjuries from "@/assets/problem-injuries.png";
import problemFire from "@/assets/problem-fire.png";

const STAT_SLIDES: StatSlide[] = [
  {
    image: problemStampedes,
    alt: "Stampede fatalities graph",
    label: "STAMPEDE INCIDENTS",
    heading: "~800 Deaths Annually",
    description:
      "Stampedes remain one of the deadliest crowd disasters, causing ~800 deaths annually, with over 11,000 fatalities recorded between 2006–2019, primarily during mass gatherings and evacuation failures.",
  },
  {
    image: problemInjuries,
    alt: "Disaster-related injuries graph",
    label: "DISASTER INJURIES",
    heading: "~36% Increase Over a Decade",
    description:
      "Disaster-related injuries in India have increased by ~36% over the last decade, driven by rapid urbanization, higher crowd density, and delayed early-warning interventions.",
  },
  {
    image: problemFire,
    alt: "Urban fire incidents graph",
    label: "URBAN FIRE EXPOSURE",
    heading: "15,000–18,000 Injuries Per Year",
    description:
      "Urban fire incidents in India consistently cause 15,000–18,000 injuries annually, while fatalities remain lower at 3,000–4,000 deaths per year, highlighting survivability but severe exposure risk in dense environments.",
  },
];

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
  <SpotlightCard
    className="glass-card"
    spotlightColor="rgba(177, 158, 239, 0.22)"
    style={{
      padding: 0,
      backgroundImage:
        "linear-gradient(180deg, rgba(12, 11, 20, 0.82), rgba(12, 11, 20, 0.9)), url('" + sentinelBackdrop + "')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundBlendMode: "soft-light"
    }}
  >
    <div
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "stretch",
        textAlign: "left"
      }}
    >
      <div style={{ color: "#f8fafc", fontWeight: 800, fontSize: 24, textAlign: "center", letterSpacing: 0.2 }}>{title}</div>
      <div style={{ color: "rgba(248, 250, 252, 0.82)", fontSize: 15.5, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
    </div>
  </SpotlightCard>
);

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const primaryCta = () => navigate(user ? "/dashboard" : "/login");
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // For scroll-locked sections taller than ~1.5 viewports,
    // scroll directly to their top so the fixed overlay activates.
    if (rect.height > window.innerHeight * 1.5) {
      window.scrollTo({ top: rect.top + window.scrollY, behavior: "smooth" });
      return;
    }

    const NAV_SAFE_OFFSET = 80; // approximate nav height/blurred bar
    const centerOffset = Math.max(0, (window.innerHeight - rect.height) / 2);
    const offset = Math.max(NAV_SAFE_OFFSET, centerOffset);
    const targetY = rect.top + window.scrollY - offset;

    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
  };

  const [productTab, setProductTab] = useState(0);
  const productTabs = ["THE PROBLEM", "CURRENT SOLUTIONS", "SENTINEL'S ADVANTAGE"] as const;
  const performaTabStack = "Performa, 'Plus Jakarta Sans', sans-serif";

  /* ── Scroll-aware navbar hide/show ── */
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const threshold = 8; // minimum delta to trigger

      if (currentY < 60) {
        // Always show near the top
        setNavVisible(true);
      } else if (Math.abs(currentY - lastScrollY.current) > threshold) {
        setNavVisible(currentY < lastScrollY.current);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div id="top" style={{ color: "#f8fafc", scrollBehavior: "smooth" }}>
      {/* ── Floating Pill Navbar ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "center",
          padding: "14px 24px 0",
          pointerEvents: "none",
          transform: navVisible ? "translateY(0)" : "translateY(-110%)",
          opacity: navVisible ? 1 : 0,
          transition: "transform 0.45s cubic-bezier(0.4, 0, 0.1, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.1, 1)",
          willChange: "transform, opacity"
        }}
      >
        <nav
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            width: "100%",
            maxWidth: 1180,
            padding: "12px 10px 12px 24px",
            borderRadius: 9999,
            background: "rgba(11, 10, 21, 0.7)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            border: "1px solid rgba(177, 158, 239, 0.18)",
            boxShadow:
              "0 4px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(177, 158, 239, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)"
          }}
        >
          {/* Wordmark */}
          <Link
            to="/"
            style={{
              color: "#f8fafc",
              textDecoration: "none",
              fontSize: 32,
              fontWeight: 800,
              fontFamily: "Performa, 'Plus Jakarta Sans', 'Satoshi', sans-serif",
              marginBottom: 2,
              letterSpacing: 1.5,
              lineHeight: 0.8,
              flexShrink: 0
            }}
          >
            SENTINEL
          </Link>

          {/* Nav items */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: "Home", action: () => scrollTo("top") },
              { label: "Product", action: () => scrollTo("product-section") },
              { label: "References", action: () => scrollTo("statistics-section") },
              { label: "About Us", action: () => scrollTo("about-us") },
              { label: "Use Cases", action: () => scrollTo("use-cases") }
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  padding: "10px 22px",
                  borderRadius: 9999,
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "rgba(248, 250, 252, 0.7)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 0.2,
                  transition: "all 0.25s ease",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#f8fafc";
                  e.currentTarget.style.background = "rgba(177, 158, 239, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(177, 158, 239, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(248, 250, 252, 0.7)";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {item.label}
              </button>
            ))}

            {/* CTA — Login to Dashboard */}
            <Link
              to={user ? "/dashboard" : "/login"}
              style={{
                padding: "10px 24px",
                borderRadius: 9999,
                background: "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)",
                border: "1px solid rgba(177, 158, 239, 0.35)",
                color: "#f8fafc",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
                transition: "all 0.25s ease",
                display: "inline-flex",
                alignItems: "center",
                marginRight: 4
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(177, 158, 239, 0.38) 0%, rgba(124, 107, 191, 0.28) 100%)";
                e.currentTarget.style.boxShadow = "0 0 16px rgba(177, 158, 239, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Login to Dashboard
            </Link>
          </div>
        </nav>
      </div>

      {/* Spacer for fixed navbar */}
      <div style={{ height: 72 }} />

      <div style={{ maxWidth: 1350, margin: "0 auto", padding: "48px 20px 0" }}>
        {/* Hero — headline left, visual right */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            justifyItems: "center",
            gap: 42,
            padding: "60px 0 70px",
            minHeight: "73vh"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22, textAlign: "left", alignItems: "flex-start", paddingLeft: 18 }}>
            <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.25 }}>
              <ShinyText
                text="Crowd Safety, Reimagined."
                speed={2.6}
                spread={120}
                color="rgba(248, 250, 252, 0.72)"
                shineColor="#ffffff"
                pauseOnHover={false}
                yoyo
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "rgba(248, 250, 252, 0.78)", maxWidth: 560, lineHeight: 1.6, letterSpacing: 0.5 }}>
              Proactive intelligence for safer, smarter evacuations.
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
              <Link
                to="/signup"
                style={{
                  padding: "12px 26px",
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)",
                  border: "1px solid rgba(177, 158, 239, 0.35)",
                  color: "#f8fafc",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(177, 158, 239, 0.38) 0%, rgba(124, 107, 191, 0.28) 100%)";
                  e.currentTarget.style.boxShadow = "0 0 16px rgba(177, 158, 239, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Enter SENTINEL
              </Link>
              <button
                onClick={() => scrollTo("about-us")}
                style={{
                  padding: "12px 26px",
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)",
                  border: "1px solid rgba(177, 158, 239, 0.35)",
                  color: "#f8fafc",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: 0.2,
                  whiteSpace: "nowrap",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(177, 158, 239, 0.38) 0%, rgba(124, 107, 191, 0.28) 100%)";
                  e.currentTarget.style.boxShadow = "0 0 16px rgba(177, 158, 239, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(177, 158, 239, 0.25) 0%, rgba(124, 107, 191, 0.18) 100%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                About Us
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <div style={{ width: "100%", maxWidth: 640 }}>
              <div style={{ width: "100%", aspectRatio: "16 / 9" }}>
                <TiltedCard
                  imageSrc={sentinelMain}
                  altText="SENTINEL platform overview"
                  containerWidth="100%"
                  containerHeight="100%"
                  imageWidth="100%"
                  imageHeight="100%"
                  rotateAmplitude={10}
                  scaleOnHover={1.035}
                  showTooltip={false}
                  showMobileWarning={false}
                />
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 120 }} />

      {/* Product Section — Tab-based */}
      <section id="product-section" style={{ display: "flex", flexDirection: "column", gap: 0, scrollMarginTop: 120 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 36
          }}
        >
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

        <div style={{ height: 5 }} />

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Product information"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginBottom: 44,
            flexWrap: "wrap",
            maxWidth: 1180,
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          {productTabs.map((label, i) => (
            <button
              key={label}
              role="tab"
              aria-selected={productTab === i}
              tabIndex={productTab === i ? 0 : -1}
              onClick={() => setProductTab(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); setProductTab((i + 1) % productTabs.length); }
                if (e.key === "ArrowLeft") { e.preventDefault(); setProductTab((i - 1 + productTabs.length) % productTabs.length); }
              }}
              style={{
                padding: "13px 28px",
                borderRadius: 10,
                border: productTab === i
                  ? "1px solid rgba(177, 158, 239, 0.55)"
                  : "1px solid rgba(177, 158, 239, 0.15)",
                background: productTab === i
                  ? "rgba(177, 158, 239, 0.12)"
                  : "rgba(255, 255, 255, 0.04)",
                color: productTab === i ? "#f8fafc" : "rgba(248, 250, 252, 0.5)",
                cursor: "pointer",
                fontFamily: performaTabStack,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 0.8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: productTab === i
                  ? "0 0 20px rgba(177, 158, 239, 0.12), inset 0 0 12px rgba(177, 158, 239, 0.06)"
                  : "none",
                whiteSpace: "nowrap"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ height: 5 }} />

        {/* Tab content */}
        <div
          role="tabpanel"
          className="glass-card"
          style={{
            position: "relative",
            minHeight: 400,
            overflow: "hidden",
            paddingTop: "42px",
            paddingLeft: "32px",
            paddingRight: "32px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(177, 158, 239, 0.18)",
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%"
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── TAB 1: THE PROBLEM ── */}
            {productTab === 0 && (
              <motion.div
                key="tab-problem"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 48,
                  alignItems: "center",
                  maxWidth: 1080,
                  margin: "0 auto"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#f8fafc", textAlign: "center", paddingBottom: 12 }}>The Root Cause</div>
                  <div style={{ color: "rgba(248, 250, 252, 0.78)", fontSize: 17, lineHeight: 1.7 }}>
                    Crowd risk rarely originates from panic; it develops through early-stage imbalances such as uneven flow, localized density accumulation, and delayed response. As these conditions intensify, safety diminishes and decision windows narrow. By the time risk becomes visible, reaction time has already collapsed, forcing response into a reactive state.
                    <br /><br />
                    <span style={{ color: "rgba(177, 158, 239, 0.9)", fontWeight: 600}}>
                      SENTINEL addresses crowd risk before it escalates.
                    </span>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div style={{ width: "100%", maxWidth: 500 }}>
                    <TiltedCard
                      imageSrc={problemInitial}
                      altText="Crowd risk visualization"
                      containerWidth="100%"
                      containerHeight="auto"
                      imageWidth="100%"
                      imageHeight="auto"
                      rotateAmplitude={10}
                      scaleOnHover={1.035}
                      showTooltip={false}
                      showMobileWarning={false}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── TAB 2: CURRENT SOLUTIONS ── */}
            {productTab === 1 && (
              <motion.div
                key="tab-solutions"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                style={{ maxWidth: 960, margin: "0 auto" }}
              >
                <div style={{ fontSize: 40, fontWeight: 800, color: "#f8fafc", marginBottom: 26, textAlign: "center" }}>
                  Why Existing Systems Fall Short
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, textAlign: "center", marginTop: 44, cursor: "default"}}>
                  {[
                    { title: "CCTV & Video Surveillance", desc: "Broad visual coverage enables monitoring, but detection remains manual and delayed, making early anomaly recognition unreliable under fast-changing conditions." },
                    { title: "People Counting Systems", desc: "Basic occupancy systems tracking provides headcounts, but lacks flow awareness, spatial density context, and any predictive movement insight that can be derived." },
                    { title: "AI Video Analytics", desc: "Advanced tracking systems improve insight, yet systems remain costly, bandwidth-intensive, and largely dependent on human-driven decisions which reduce efficiency." }
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, delay: 0.06 + i * 0.09, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <SpotlightCard
                        className="glass-card solutions-spotlight-card"
                        spotlightColor="rgba(177, 158, 239, 0.25)"
                        style={{
                          padding: 0,
                          backgroundImage:
                            "linear-gradient(180deg, rgba(12, 11, 20, 0.82), rgba(12, 11, 20, 0.9)), url('" + sentinelBackdrop + "')",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          backgroundBlendMode: "soft-light"
                        }}
                      >
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: "#f8fafc" }}>{item.title}</div>
                          <div style={{ color: "rgba(248, 250, 252, 0.72)", fontSize: 14.5, lineHeight: 1.7 }}>{item.desc}</div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── TAB 3: SENTINEL'S ADVANTAGE ── */}
            {productTab === 2 && (
              <motion.div
                key="tab-advantage"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 48,
                  alignItems: "center",
                  maxWidth: 1080,
                  margin: "0 auto"
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <div style={{ width: "100%", maxWidth: 500 }}>
                    <TiltedCard
                      imageSrc={sentinelAdvantage}
                      altText="SENTINEL predictive intelligence"
                      containerWidth="100%"
                      containerHeight="auto"
                      imageWidth="100%"
                      imageHeight="auto"
                      rotateAmplitude={10}
                      scaleOnHover={1.035}
                      showTooltip={false}
                      showMobileWarning={false}
                    />
                  </div>
                </motion.div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#f8fafc", textAlign: "center", paddingBottom: 12 }}>
                    Reaction to Prediction
                  </div>
                  <div style={{ color: "rgba(248, 250, 252, 0.78)", fontSize: 17, lineHeight: 1.7, fontWeight: 400 }}>
                    • SENTINEL combines distributed sensing with flow-aware machine learning to continuously analyze crowd dynamics in real time.
                    <br /><br />
                    • Congestion patterns, density imbalances, and directional conflicts are identified before risk becomes visible.
                    <br /><br />
                    • Predictive insights enable proactive decision-making rather than reactive response.
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      <div style={{ height: 300 }} />

      {/* Statistics / Impact Carousel */}
      <section
        id="statistics-section"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          scrollMarginTop: 120,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <SplitText
              text="The Human Cost of Delayed Response"
              className="stats-heading"
              delay={45}
              duration={1}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 32 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-80px"
              textAlign="center"
              tag="div"
            />
          </div>
        </div>

        <StatisticsCarousel slides={STAT_SLIDES} />
      </section>

      <div style={{ height: 50 }} />

      {/* About Us — Scroll-locked Section */}
      <AboutUs />

      <div style={{ height: 50 }} />

      {/* Section 7 — Use Cases */}
      <section id="use-cases" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <ScrollFloat
            animationDuration={10}
            ease="back.inOut(3)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.11}
            textClassName="use-cases-heading"
          >
            Use Cases
          </ScrollFloat>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 0.3fr))", gap: 18, alignItems: "center", justifyContent: "center"}}>
          <Card title="Large Public Buildings">
            <div style={{ textAlign: "center", fontSize: 18 }}>
              Malls, airports, and convention centers rely on uninterrupted movement. SENTINEL keeps lobbies and corridors flowing, flags risky congestion early, and guides staff to respond before queues harden into blockages.
            </div>
          </Card>
          <Card title="Educational Institutions">
            <div style={{ textAlign: "center", fontSize: 18 }}>
              Campuses, schools, and exam halls juggle surges at bells and events. Real-time density sensing and predictive routing help disperse crowds, keep stairwells clear, and protect students during drills or incidents.
            </div>
          </Card>
          <Card title="Mass Gathering Venues">
            <div style={{ textAlign: "center", fontSize: 18 }}>
              Stadiums, concerts, and religious gatherings demand rapid, safe egress. The platform detects turbulence in crowd flow, issues targeted guidance, and aligns stewards to keep routes clear when emotions run high.
            </div>
          </Card>
        </div>
      </section>

      <div style={{ height: 150 }} />

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
