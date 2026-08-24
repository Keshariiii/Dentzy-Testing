import React from 'react';
import './Process.css';

const Process = () => {
    return (
        <section className="process section-padding">
            <div className="container">
                <h2 className="section-title text-center reveal from-bottom">The DEN<span className="process-highlight">T</span>ZY Process</h2>

                <div className="process-steps animate-on-scroll reveal-stagger">
                    <div className="process-step">
                        <div className="step-content">Receive</div>
                        <div className="step-arrow"></div>
                    </div>
                    <div className="process-step">
                        <div className="step-content">Revive</div>
                        <div className="step-arrow"></div>
                    </div>
                    <div className="process-step">
                        <div className="step-content">Restore</div>
                    </div>
                </div>

                <div className="dentzy-cuz-section animate-on-scroll delay-200 reveal from-bottom">
                    <div className="cuz-content">
                        <h2 className="cuz-title">BE A DEN<span className="process-highlight">T</span>ZY<br />CUZ...</h2>
                        <p className="cuz-subtitle">If "Dentzy" were a person, they would be a tech-savvy craftsman.</p>
                    </div>
                    <div className="cuz-image-container">
                        <img src="/images/dentzy-cuz.jpg" alt="Tech-savvy craftsman" className="cuz-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Process;
