import React from 'react';
import './PerfectSmile.css';
import { PERFECT_SMILE_DATA } from '../data/landingContent';

const PerfectSmile = () => {
    return (
        <section className="perfect-smile-section section-padding">
            <div className="container perfect-smile-container">
                <div className="perfect-smile-content">
                    <h2 className="smile-title">
                        {PERFECT_SMILE_DATA.headlineLines.map((line, i) => (
                            <React.Fragment key={line}>
                                {line}
                                {i < PERFECT_SMILE_DATA.headlineLines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </h2>
                    <p className="smile-subtitle">{PERFECT_SMILE_DATA.subtitle}</p>

                    <div className="smile-brand">
                        <span className="smile-logo dentzy-brand">DEN<span className="dentzy-t">T</span>ZY</span>
                    </div>

                    <p className="smile-footer-text">
                        {PERFECT_SMILE_DATA.footerLines.map((line, i) => (
                            <React.Fragment key={line}>
                                {line}
                                {i < PERFECT_SMILE_DATA.footerLines.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>
                </div>
                <div className="perfect-smile-image">
                    <img src={PERFECT_SMILE_DATA.image} alt={PERFECT_SMILE_DATA.imageAlt} loading="lazy" decoding="async" />
                </div>
            </div>
        </section>
    );
};

export default PerfectSmile;
