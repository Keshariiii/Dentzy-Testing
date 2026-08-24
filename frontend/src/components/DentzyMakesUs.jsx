import React from 'react';
import './DentzyMakesUs.css';

const DentzyMakesUs = () => {
    return (
        <section className="dentzy-makes-us section-padding">
            <div className="container">
                <h2 className="makes-us-title text-center reveal from-bottom">This Is What Makes Us <span>DENTZY</span></h2>

                <div className="makes-us-item reveal from-left">
                    <div className="makes-us-text">
                        <h3>Complete Denture (single arch)</h3>
                        <p>
                            Tooth loss can significantly affect a person's appearance, confidence, and ability to
                            chew and speak properly. A complete denture (single arch) is a reliable and time-tested
                            solution for patients who have lost all teeth in either the upper (maxillary) or
                            lower (mandibular) arch.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/denture.jpg" alt="Complete Denture" />
                    </div>
                </div>

                <div className="makes-us-item reverse reveal from-right">
                    <div className="makes-us-text">
                        <h3>Flexible denture</h3>
                        <p>
                            Flexible dentures are removable dental prostheses made from advanced thermoplastic
                            materials rather than conventional acrylic or metal frameworks. Their flexible nature
                            allows the denture to adapt comfortably to the natural contours of the gums, offering
                            a secure and natural fit.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/flexible-denture.jpg" alt="Flexible Denture" />
                    </div>
                </div>

                <div className="makes-us-item">
                    <div className="makes-us-text">
                        <h3>REMOVABLE PARTIAL DENTURE</h3>
                        <p>
                            Missing one or more teeth can affect chewing, speech, and overall confidence. A
                            Removable Partial Denture (RPD) is a practical and effective tooth replacement
                            option that restores function and aesthetics while preserving remaining natural
                            teeth.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/rpd.jpg" alt="Removable Partial Denture" />
                    </div>
                </div>

                <div className="makes-us-item reverse">
                    <div className="makes-us-text">
                        <h3>METAL CROWNS AND BRIDGES</h3>
                        <p>
                            A dental metal crown is a full-coverage restoration that protects and strengthens
                            a damaged or heavily restored tooth.
                            A metal bridge replaces one or more missing teeth by anchoring artificial teeth
                            to metal crowns placed on adjacent natural teeth.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/metal.jpg" alt="Metal Crowns and Bridges" />
                    </div>
                </div>

                <div className="makes-us-item">
                    <div className="makes-us-text">
                        <h3>PFM</h3>
                        <p>
                            A PFM crown (Porcelain-Fused-to-Metal crown) has long been one of the most
                            trusted restorations in dentistry. Known for combining the strength of metal with
                            the natural appearance of porcelain, PFM crowns offer a reliable and cost-effective
                            solution for restoring damaged or weakened teeth.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/pfm.jpg" alt="PFM" />
                    </div>
                </div>

                <div className="makes-us-item reverse">
                    <div className="makes-us-text">
                        <h3>ZIRCONIA</h3>
                        <p>
                            A zirconia crown is a full-coverage dental restoration made from zirconium
                            dioxide, a high-strength ceramic material. It can be fabricated as:
                            <br />• Monolithic zirconia (single solid structure)
                            <br />• Layered zirconia (zirconia core with ceramic layering for enhanced aesthetics)
                            Zirconia crowns are designed using advanced CAD/CAM technology, ensuring
                            exceptional precision and consistency.
                        </p>
                    </div>
                    <div className="makes-us-image animate-on-scroll">
                        <img src="/images/zirconia.jpg" alt="Zirconia" />
                    </div>
                </div>

            </div>
        </section>
    );
};

export default DentzyMakesUs;
