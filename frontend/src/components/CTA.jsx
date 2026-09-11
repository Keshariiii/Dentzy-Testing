'use client';
import Link from 'next/link';
import React from 'react';
import './CTA.css';
import { VengeanceButton } from './ui/vengeance-button';
import { VengeanceCard } from './ui/vengeance-card';

const CTA = () => {

    return (
        <section className="cta section-padding">
            <div className="cta-overlay"></div>
            <div className="container cta-content animate-on-scroll">
                <VengeanceCard className="group border-none bg-transparent mx-auto inline-block p-8">
                    <h2>ARE YOU A DENTIST?</h2>
                    <VengeanceButton size="lg" asChild>
                        <Link href="/login">Get Started</Link>
                    </VengeanceButton>
                </VengeanceCard>
            </div>
        </section>
    );
};


export default CTA;
