import React from 'react';
import './Process.css';
import { PROCESS_STEPS, PROCESS_COPY } from '../data/landingContent';

const Process = () => {
    return (
        <section className="process section-padding">
            <div className="container">
                <h2 className="section-title text-center reveal from-bottom" style={{ color: 'var(--dz-color-text-primary, #333)' }}>The <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span> Process</h2>
                <p className="section-subtitle text-center">{PROCESS_COPY.subtitle}</p>

                <div className="process-steps animate-on-scroll reveal-stagger">
                    {PROCESS_STEPS.map((item, idx) => (
                        <div className="process-step" key={item.key}>
                            <div className="step-content">{item.label}</div>
                            {idx < PROCESS_STEPS.length - 1 && <div className="step-arrow"></div>}
                        </div>
                    ))}
                </div>

                <div className="dentzy-cuz-section animate-on-scroll delay-200 reveal from-bottom">
                    <div className="cuz-content">
                        <h2 className="cuz-title">BE A <span className="dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span><br />CUZ...</h2>
                        <p className="cuz-subtitle">{PROCESS_COPY.cuzSubtitle}</p>
                    </div>
                    <div className="cuz-image-container">
                        <img src={PROCESS_COPY.cuzImage} alt={PROCESS_COPY.cuzAlt} className="cuz-image" loading="lazy" decoding="async" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Process;
