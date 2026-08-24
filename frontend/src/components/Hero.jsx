import React from 'react';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero" id="home">
            <video className="hero-video" autoPlay loop muted playsInline>
                <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
            <div className="hero-overlay"></div>
            <div className="hero-content container animate-on-scroll">
                <h1>
                    <span className="hero-line">CRAF<span className="hero-accent">T</span>ED WITH CARE</span>
                    <span className="hero-line hero-subtext">FOR PATIENTS WELFARE</span>
                </h1>
            </div>
        </section>
    );
};

export default Hero;
