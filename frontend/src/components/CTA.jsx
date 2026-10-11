'use client';
import Link from 'next/link';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TwentyFirstIconButton } from './ui/twentyfirst-icon-button';
import './CTA.css';
import { VengeanceCard } from './ui/vengeance-card';

const CTA = () => {

    return (
        <section className="cta section-padding">
            <div className="cta-overlay"></div>
            <div className="container cta-content animate-on-scroll">
                <VengeanceCard className="group border-none bg-transparent mx-auto inline-block p-8 text-center">
                    <h2>ARE YOU A DENTIST?</h2>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <Link href="/login" aria-label="Get Started" title="Get Started">
                            <TwentyFirstIconButton
                                icon={<ArrowRight size={22} />}
                                title="Get Started"
                                ariaLabel="Get Started"
                                variant="primary"
                                size="lg"
                                rounded="full"
                            />
                        </Link>
                    </div>
                </VengeanceCard>
            </div>
        </section>
    );
};


export default CTA;
