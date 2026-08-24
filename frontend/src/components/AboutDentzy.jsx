import React from 'react';
import './AboutDentzy.css';

const AboutDentzy = () => {
    return (
        <section className="about-dentzy section-padding" id="about">
            <video className="about-bg-video" autoPlay loop muted playsInline>
                <source src="/images/about-bg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="about-overlay"></div>
            <div className="container about-content animate-on-scroll">
                <h2 className="about-title">About DEN<span>T</span>ZY</h2>
                <p className="about-subtitle">WE ARE HERE TO WIN YOUR HEART AND EARN YOUR SMILE.</p>


            </div>
        </section>
    );
};

export default AboutDentzy;
