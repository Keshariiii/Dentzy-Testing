import React from 'react';
import './Services.css';
import { SERVICES_DATA } from '../data/landingContent';

const Services = () => {
    return (
        <section className="services section-padding" id="services">
            <div className="container">
                <h2 className="section-title text-center reveal from-bottom">Our Signature Services</h2>
                <p className="section-subtitle text-center">Precision-crafted restorations for every clinical need</p>
                <div className="services-grid reveal-stagger">
                    {SERVICES_DATA.map((service, index) => (
                        <div className={`service-card animate-on-scroll delay-${(index + 1) * 100}`} key={service.key || index}>
                            <div className="service-image">
                                <img src={service.image} alt={service.displayTitle} loading="lazy" decoding="async" />
                            </div>
                            <div className="service-info">
                                <h3>{service.displayTitle}</h3>
                                <p>{service.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


export default Services;
