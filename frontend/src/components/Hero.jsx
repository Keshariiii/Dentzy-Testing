'use client';
import React from 'react';
import './Hero.css';
import { AnimasterReveal } from './ui/animaster-reveal';
import { AnimasterTextShimmer } from './ui/animaster-text-shimmer';

const Hero = () => {
    return (
        <section className="hero" id="home">
            <video className="hero-video" autoPlay loop muted playsInline preload="metadata">
                <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
            <div className="hero-overlay"></div>
            <div className="hero-content container">
                <h1>
                    <span className="hero-line">
                        <AnimasterReveal
                            text="CRAFTED WITH CARE"
                            staggerDelay={0.06}
                            initialY={30}
                            wordClassName="hero-reveal-word"
                        />
                    </span>
                    <span className="hero-line hero-subtext">
                        <AnimasterTextShimmer duration={4}>
                            FOR PATIENTS WELFARE
                        </AnimasterTextShimmer>
                    </span>
                </h1>
            </div>
        </section>
    );
};

export default Hero;
