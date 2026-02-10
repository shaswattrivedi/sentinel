import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

type SplitType = "chars" | "words" | "lines" | "chars words" | "words chars" | "chars lines" | "lines chars" | "words lines" | "lines words";

type FromTo = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
};

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: SplitType;
  from?: FromTo;
  to?: FromTo;
  threshold?: number;
  rootMargin?: string;
  textAlign?: React.CSSProperties["textAlign"];
  tag?: keyof HTMLElementTagNameMap;
  onLetterAnimationComplete?: () => void;
};

type SplitTarget = HTMLElement | SVGElement;

type SplitInstance = {
  chars: SplitTarget[];
  words: SplitTarget[];
  lines: SplitTarget[];
  revert: () => void;
};

type SplitElement = HTMLElement & { _rbsplitInstance?: SplitInstance | null };

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 20,
  duration = 0.5,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete
}) => {
  const ref = useRef<SplitElement | null>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (typeof document === "undefined" || !(document as any).fonts) {
      setFontsLoaded(true);
      return;
    }
    const fonts = (document as any).fonts;
    if (fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      fonts.ready.then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch (_) {
          /* noop */
        }
        el._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || "");
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets: SplitTarget[] | undefined;
      const assignTargets = (self: SplitInstance) => {
        if (splitType.includes("chars") && self.chars.length) targets = self.chars;
        if (!targets && splitType.includes("words") && self.words.length) targets = self.words;
        if (!targets && splitType.includes("lines") && self.lines.length) targets = self.lines;
        if (!targets) targets = self.chars || self.words || self.lines;
      };

      const splitInstance: SplitInstance = new (GSAPSplitText as unknown as new (
        el: HTMLElement,
        opts: Record<string, unknown>
      ) => SplitInstance)(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: (self: SplitInstance) => {
          assignTargets(self);
          const tween = gsap.fromTo(
            targets as gsap.TweenTarget,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: () => {
                animationCompletedRef.current = true;
                onCompleteRef.current?.();
              },
              willChange: "transform, opacity",
              force3D: true,
            }
          );
          return tween;
        },
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch (_) {
          /* noop */
        }
        el._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
      scope: ref,
    }
  );

  const RenderTag = (tag || "p") as keyof HTMLElementTagNameMap;
  const style: React.CSSProperties = {
    textAlign,
    overflow: "hidden",
    display: "inline-block",
    whiteSpace: "normal",
    wordWrap: "break-word",
    willChange: "transform, opacity",
  };
  const classes = `split-parent ${className}`.trim();

  return React.createElement(RenderTag, { ref, style, className: classes }, text);
};

export default SplitText;
