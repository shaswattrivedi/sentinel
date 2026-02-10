import React, { useState, useCallback } from "react";
import "./StatisticsCarousel.css";
import TiltedCard from "@/components/TiltedCard";

export interface StatSlide {
  image: string;
  alt: string;
  label: string;
  heading: string;
  description: string;
}

interface Props {
  slides: StatSlide[];
}

const ArrowLeft: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ArrowRight: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

const StatisticsCarousel: React.FC<Props> = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setCurrent((prev) => (prev + dir + total) % total);
    },
    [total]
  );

  return (
    <div className="stats-carousel">
      {/* Track */}
      <div
        className="stats-carousel__track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="stats-carousel__slide">
            {/* Image — left */}
            <div className="stats-carousel__image-wrap">
              <TiltedCard
                imageSrc={slide.image}
                altText={slide.alt}
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

            {/* Text — right */}
            <div className="stats-carousel__text">
              <span className="stats-carousel__label">{slide.label}</span>
              <h3 className="stats-carousel__heading">{slide.heading}</h3>
              <p className="stats-carousel__description">{slide.description}</p>

              <div className="stats-carousel__counter">
                <span className="stats-carousel__counter-current">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="stats-carousel__counter-sep">/</span>
                <span className="stats-carousel__counter-total">
                  {String(total).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        className="stats-carousel__arrow stats-carousel__arrow--left"
        onClick={() => goTo(-1)}
        aria-label="Previous slide"
      >
        <ArrowLeft />
      </button>
      <button
        className="stats-carousel__arrow stats-carousel__arrow--right"
        onClick={() => goTo(1)}
        aria-label="Next slide"
      >
        <ArrowRight />
      </button>

      {/* Progress bar */}
      <div
        className="stats-carousel__progress"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
  );
};

export default StatisticsCarousel;
