import React from 'react';
import './FutureServices.css';

const FutureServices = () => {
    return (
        <section className="future-services section-padding">
            <div className="container">
                <h2 className="section-title text-center reveal from-bottom">Upcoming Digital Innovations</h2>
                <div className="future-services-grid reveal-stagger">
                    <div className="future-service-card animate-on-scroll delay-100">
                        <h3>Clear Aligners</h3>
                        <p>Advanced orthodontic splints and aligner workflows designed for maximum patient comfort and predictable tooth movement.</p>
                    </div>
                    <div className="future-service-card animate-on-scroll delay-200">
                        <h3>Custom Implant Abutments</h3>
                        <p>Precision-milled titanium and hybrid abutments tailored to individual emergence profiles for superior aesthetics.</p>
                    </div>
                    <div className="future-service-card animate-on-scroll delay-300">
                        <h3>3D Surgical Guides</h3>
                        <p>Accurate, CAD/CAM designed implant surgical guides that integrate CBCT data for flawless implant placement.</p>
                    </div>
                    <div className="future-service-card animate-on-scroll delay-400">
                        <h3>Digital Smile Design</h3>
                        <p>Comprehensive smile simulations and diagnostic mockups to help patients visualize their final restorations.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FutureServices;
