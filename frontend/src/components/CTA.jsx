'use client';
import Link from 'next/link';
import React from 'react';
import './CTA.css';


const CTA = () => {

    return (
        <section className="cta section-padding">
            <div className="cta-overlay"></div>
            <div className="container cta-content animate-on-scroll">
                <h2>ARE YOU A DENTIST?</h2>
                <Link href="/login" className="btn btn-cta">Get Started</Link>
            </div>
        </section>
    );
};


export default CTA;
