'use client';
import React, { useRef, useEffect, useState } from 'react';
import './AboutDentzy.css';

const AboutDentzy = () => {
    const videoRef = useRef(null);
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '300px' }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isVisible && videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
        }
    }, [isVisible]);

    return (
        <section className="about-dentzy section-padding" id="about" ref={sectionRef}>
            <video
                className="about-bg-video"
                ref={videoRef}
                loop
                muted
                playsInline
                preload="none"
            >
                {isVisible && <source src="/images/about-bg.mp4" type="video/mp4" />}
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
