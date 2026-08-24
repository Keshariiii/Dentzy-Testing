import React from 'react';
import './PerfectSmile.css';

const PerfectSmile = () => {
    return (
        <section className="perfect-smile-section section-padding">
            <div className="container perfect-smile-container">
                <div className="perfect-smile-content">
                    <h2 className="smile-title">EVERYONE <br /> DESERVES A <br /> PERFECT <br /> SMILE,</h2>
                    <p className="smile-subtitle">and we're here to help you achieve yours</p>

                    <div className="smile-brand">
                        <span className="smile-logo">DEN<span className="highlight">T</span>ZY</span>
                    </div>

                    <p className="smile-footer-text">
                        Crafted With Care,<br />
                        For Patients Welfare.
                    </p>
                </div>
                <div className="perfect-smile-image">
                    <img src="/images/perfect-smile.jpg" alt="Hands holding dental mold" />
                </div>
            </div>
        </section>
    );
};

export default PerfectSmile;
