import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./AboutUs.css";

/* ================================================================
   Panel data
   ================================================================ */

interface PanelData {
  header: string;
  subheader?: string;
  text: string;
}

const PANELS: PanelData[] = [
  {
    header: "About Us",
    subheader: "Our Vision",
    text: "At SENTINEL, our vision is to redefine how public and industrial spaces ensure safety in high-density environments. We envision a future where every crowded venue — from transit hubs and campuses to stadiums and smart cities — is equipped with intelligent, adaptive systems that anticipate risk before it escalates.",
  },
  {
    header: "How We Achieve Our Vision",
    text: "We achieve our vision by integrating IoT-based crowd sensing with real-time machine learning and predictive risk analytics. SENTINEL continuously analyzes movement patterns, forecasts congestion, and generates explainable risk insights to enable proactive decision-making. By transforming raw telemetry into actionable intelligence and adaptive evacuation guidance, we ensure safer, smarter environments driven by data.",
  },
  {
    header: "Our Differentiator",
    text: "What sets SENTINEL apart is its hybrid intelligence model—combining low-cost IoT sensor data with real-time ML-driven risk scoring to deliver explainable, actionable crowd safety insights. Unlike traditional monitoring systems that only display raw counts, SENTINEL predicts congestion trends, computes dynamic risk levels, and translates them into clear evacuation guidance in real time. This fusion of affordability, predictive analytics, and decision intelligence makes it both practical for deployment and defensible in high-risk environments.",
  },
];

const PANEL_COUNT = PANELS.length;
const TRANSITION_COOLDOWN = 850; // ms before next panel switch is allowed

/* ================================================================
   Component
   ================================================================ */

const AboutUs: React.FC = () => {
  const [activePanel, setActivePanel] = useState(0);
  const [sectionActive, setSectionActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const activePanelRef = useRef(0);

  /* Keep ref in sync so wheel/touch handlers always read the latest panel */
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  /* ── Passive scroll sync (fallback while not animating) ── */
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current || isAnimating.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const inZone = rect.top <= 1 && rect.bottom >= vh - 1;

      setSectionActive(inZone);

      if (inZone) {
        const scrolled = Math.max(0, -rect.top);
        const panel = Math.min(
          PANEL_COUNT - 1,
          Math.max(0, Math.round(scrolled / vh))
        );
        setActivePanel(panel);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Wheel handler with approach-zone entry/exit ── */
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!sectionRef.current || isAnimating.current) return;
    if (Math.abs(e.deltaY) < 3) return; // ignore micro-inertia

    const rect = sectionRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const dir = e.deltaY > 0 ? 1 : -1;
    const sTop = window.scrollY + rect.top;

    /* ── APPROACH from above (scrolling ↓): snap to Panel 0 ── */
    if (dir === 1 && rect.top > -5 && rect.top < vh * 0.35) {
      e.preventDefault();
      isAnimating.current = true;
      setActivePanel(0);
      setSectionActive(true);
      window.scrollTo({ top: sTop, behavior: "smooth" });
      setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
      return;
    }

    /* ── APPROACH from below (scrolling ↑): snap to last Panel ── */
    if (dir === -1 && rect.bottom > vh * 0.65 && rect.bottom < vh + 5) {
      e.preventDefault();
      isAnimating.current = true;
      const last = PANEL_COUNT - 1;
      setActivePanel(last);
      setSectionActive(true);
      window.scrollTo({ top: sTop + last * vh, behavior: "smooth" });
      setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
      return;
    }

    /* ── ACTIVE ZONE: section fills the viewport ── */
    const inZone = rect.top <= 2 && rect.bottom >= vh - 2;
    if (!inZone) return;

    e.preventDefault();

    const current = activePanelRef.current;
    const next = current + dir;

    /* Exit ↓ past last panel → land on Use Cases */
    if (next >= PANEL_COUNT) {
      isAnimating.current = true;
      setSectionActive(false);
      window.scrollTo({ top: sTop + PANEL_COUNT * vh + 2, behavior: "smooth" });
      setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
      return;
    }

    /* Exit ↑ before first panel → land on References */
    if (next < 0) {
      isAnimating.current = true;
      setSectionActive(false);
      setActivePanel(0);
      window.scrollTo({ top: Math.max(0, sTop - 2), behavior: "smooth" });
      setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
      return;
    }

    /* Move between panels */
    isAnimating.current = true;
    setActivePanel(next);
    window.scrollTo({ top: sTop + next * vh, behavior: "smooth" });
    setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* ── Touch handler with approach-zone entry/exit ── */
  useEffect(() => {
    let startY = 0;
    let locked = false;

    const onStart = (e: TouchEvent) => {
      if (!sectionRef.current || isAnimating.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const inZone = rect.top <= 2 && rect.bottom >= vh - 2;
      const nearAbove = rect.top > -5 && rect.top < vh * 0.35;
      const nearBelow = rect.bottom > vh * 0.65 && rect.bottom < vh + 5;
      if (inZone || nearAbove || nearBelow) {
        startY = e.touches[0].clientY;
        locked = true;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!locked || !sectionRef.current || isAnimating.current) return;
      locked = false;

      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 50) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const dir = dy > 0 ? 1 : -1;
      const sTop = window.scrollY + rect.top;

      /* Approach from above */
      if (dir === 1 && rect.top > -5 && rect.top < vh * 0.35) {
        isAnimating.current = true;
        setActivePanel(0);
        setSectionActive(true);
        window.scrollTo({ top: sTop, behavior: "smooth" });
        setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
        return;
      }

      /* Approach from below */
      if (dir === -1 && rect.bottom > vh * 0.65 && rect.bottom < vh + 5) {
        isAnimating.current = true;
        const last = PANEL_COUNT - 1;
        setActivePanel(last);
        setSectionActive(true);
        window.scrollTo({ top: sTop + last * vh, behavior: "smooth" });
        setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
        return;
      }

      /* Active zone */
      const inZone = rect.top <= 2 && rect.bottom >= vh - 2;
      if (!inZone) return;

      const current = activePanelRef.current;
      const next = current + dir;

      if (next >= PANEL_COUNT) {
        isAnimating.current = true;
        setSectionActive(false);
        window.scrollTo({ top: sTop + PANEL_COUNT * vh + 2, behavior: "smooth" });
        setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
        return;
      }

      if (next < 0) {
        isAnimating.current = true;
        setSectionActive(false);
        setActivePanel(0);
        window.scrollTo({ top: Math.max(0, sTop - 2), behavior: "smooth" });
        setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
        return;
      }

      isAnimating.current = true;
      setActivePanel(next);
      window.scrollTo({ top: sTop + next * vh, behavior: "smooth" });
      setTimeout(() => { isAnimating.current = false; }, TRANSITION_COOLDOWN);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  /* ── Framer-motion variants ── */
  const panelVariants = {
    initial: { opacity: 0, y: 60, filter: "blur(4px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.72,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -40,
      filter: "blur(3px)",
      transition: {
        duration: 0.45,
        ease: [0.55, 0, 1, 0.45],
      },
    },
  };

  /* ── Render ── */
  return (
    <section
      ref={sectionRef}
      id="about-us"
      className="about-section-outer"
      style={{ height: `${PANEL_COUNT * 100}vh` }}
    >
      <div className={`about-section-fixed${sectionActive ? " active" : ""}`}>
        {/* Ambient glows */}
        <div className="about-glow about-glow--tl visible" />
        <div className="about-glow about-glow--br visible" />
        <div className="about-glow about-glow--center visible" />

        {/* Dividers */}
        <div className="about-section-divider about-section-divider--top" />
        <div className="about-section-divider about-section-divider--bottom" />

        {/* Progress dots (right rail) */}
        <div className="about-progress">
          {PANELS.map((_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="about-progress-line" />}
              <div
                className={`about-progress-dot${activePanel === i ? " active" : ""}`}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Panel content */}
        <div className="about-panel-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              className="about-panel"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {PANELS[activePanel].subheader && (
                <span className="about-subheader">
                  {PANELS[activePanel].subheader}
                </span>
              )}
              <h2 className="about-header">{PANELS[activePanel].header}</h2>
              <div className="about-divider" />
              <p className="about-text">{PANELS[activePanel].text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Panel counter */}
        <div className="about-counter">
          <span className="about-counter-current">
            {String(activePanel + 1).padStart(2, "0")}
          </span>
          <span className="about-counter-sep">/</span>
          <span className="about-counter-total">
            {String(PANEL_COUNT).padStart(2, "0")}
          </span>
        </div>

        {/* Scroll hint */}
        <AnimatePresence>
          {activePanel < PANEL_COUNT - 1 && (
            <motion.div
              className="about-scroll-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="about-scroll-hint-line" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AboutUs;
