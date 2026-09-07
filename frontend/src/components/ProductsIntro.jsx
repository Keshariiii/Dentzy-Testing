'use client';
import React, { useRef, useEffect, useState } from 'react';
import './ProductsIntro.css';

const ProductsIntro = () => {
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
        <section className="products-intro-section section-padding" id="products" ref={sectionRef}>
            <video
                className="products-intro-video"
                ref={videoRef}
                loop
                muted
                playsInline
                preload="none"
            >
                {isVisible && <source src="/products-bg.mp4" type="video/mp4" />}
            </video>
            <div className="products-intro-overlay"></div>
            <div className="container products-intro-content animate-on-scroll">
                <h2 className="products-title">Our PRODUC<span>T</span>S</h2>
                <p className="products-subtitle">Precision You Can Rely On</p>
            </div>
        </section>
    );
};

export default ProductsIntro;
