import React from 'react';
import './AboutDetails.css';

const AboutDetails = () => {
    return (
        <section className="about-details-section section-padding">
            <div className="container animate-on-scroll">
                <h2 className="details-title text-center">Excellence Behind Every Smile</h2>

                <div className="details-intro-box">
                    <p>
                        At DENTZY, we are dedicated to delivering the restorations that meet the needs of today's dentistry.
                        We ensure consistent quality, accuracy, and aesthetics in every case we handle.
                        Our focus is simple - to support dentists with reliable solutions that help create
                        confident, natural-looking smiles.
                    </p>
                </div>

                <div className="details-grid">
                    <div className="details-text-block">
                        <p>
                            Dentzy is a leading Indian dental brand founded by Tanish Dinesh Poojari, a
                            Certified Dental Technician (CDT). Built on a legacy of excellence, Dentzy is
                            backed by its parent company, Namrata Dental Solutions, which has been a
                            trusted leader in the dental laboratory industry mainly in Maharashtra for more than 30
                            years. By combining decades of technical expertise with modern innovation,
                            Dentzy continues to set new standards in dental craftsmanship.
                        </p>
                    </div>
                    <div className="details-text-block">
                        <p>
                            After observing the frequent friction between dental laboratories and clinicians—often caused by
                            poor customer service and a lack of mutual understanding we recognized a significant gap in the
                            industry. To bridge this divide, we envisioned a fully digital dental laboratory ecosystem.
                            Our goal is to streamline workflows and foster seamless communication between the dental lab,
                            the dentist, and the patient. By leveraging digital integration, We aim to ensure precision,
                            transparency, and a more efficient experience.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutDetails;
