import React from 'react';
import './Intro.css';

const Intro = () => {
    return (
        <section className="intro section-padding" id="intro">
            <div className="container animate-on-scroll">
                <h2 className="section-title text-center">
                    <span className="intro-highlight">Your Partner In Modern Dentistry</span>
                </h2>
                <div className="intro-content">
                    <p className="intro-text">
                        At <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>, we don't just take orders; we provide solutions. Our dedicated technical support team is available for real-time case consultations, ensuring every restoration fits perfectly the first time.
                    </p>
                </div>
            </div>
        </section >
    );
};

export default Intro;
