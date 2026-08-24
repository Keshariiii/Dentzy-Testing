import React from 'react';
import './Services.css';

const services = [
    {
        displayTitle: 'Denture', // Fixed capitalization
        image: '/images/denture.jpg',
        description: 'Tooth loss can significantly affect a person\'s appearance, confidence, and ability to chew and speak properly.'
    },
    {
        displayTitle: 'Zirconia',
        image: '/images/zirconia.jpg',
        description: 'A zirconia crown is a full-coverage dental restoration made from zirconium dioxide, a high-strength ceramic material.'
    },
    {
        displayTitle: 'PFM',
        image: '/images/pfm.jpg',
        description: 'A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most trusted restorations in dentistry.'
    },
    {
        displayTitle: 'Metal',
        image: '/images/metal.jpg',
        description: 'A dental metal crown is a full-coverage restoration that protects and strengthens a damaged or heavily restored tooth.'
    }
];

const Services = () => {
    return (
        <section className="services section-padding" id="services">
            <div className="container">
                <h2 className="section-title text-center reveal from-bottom">Our Signature Services</h2>
                <div className="services-grid reveal-stagger">
                    {services.map((service, index) => (
                        <div className={`service-card animate-on-scroll delay-${(index + 1) * 100}`} key={index}>
                            <div className="service-image">
                                <img src={service.image} alt={service.displayTitle} />
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
