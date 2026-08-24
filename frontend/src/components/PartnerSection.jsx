import React from 'react';
import './PartnerSection.css';

const PartnerSection = () => {
    return (
        <section className="partner-section section-padding">
            <div className="partner-bg"></div>
            <div className="partner-overlay"></div>
            <div className="container partner-content animate-on-scroll">
                <h2 className="partner-title">Your Partner In Modern Dentistry</h2>
                <p className="partner-text">
                    At DENTZY, we are not just a dental laboratory—we are a collaborative partner committed to improving
                    workflows, strengthening professional relationships, and supporting the future of modern dentistry.
                </p>
            </div>
        </section>
    );
};

export default PartnerSection;
