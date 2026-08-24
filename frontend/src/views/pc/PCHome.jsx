/**
 * PCHome — Desktop version of the Home/Landing page.
 *
 * Currently re-exports the existing Home component as-is.
 * All future desktop-specific landing page changes should live here.
 */
import React, { useEffect } from 'react';
import Header from '../../components/Header';
import Hero from '../../components/Hero';
import Intro from '../../components/Intro';
import Services from '../../components/Services';
import Process from '../../components/Process';
import CTA from '../../components/CTA';
import AboutDentzy from '../../components/AboutDentzy';
import AboutDetails from '../../components/AboutDetails';
import PerfectSmile from '../../components/PerfectSmile';
import PartnerSection from '../../components/PartnerSection';
import ProductsIntro from '../../components/ProductsIntro';
import DentzyMakesUs from '../../components/DentzyMakesUs';
import FutureServices from '../../components/FutureServices';
import ConnectWithUs from '../../components/ConnectWithUs';
import ContactForm from '../../components/ContactForm';
import Footer from '../../components/Footer';
import { initScrollAnimation } from '../../utils/scrollObserver';

const PCHome = () => {
    useEffect(() => {
        const cleanup = initScrollAnimation();
        return cleanup;
    }, []);

    return (
        <div className="home-page">
            <Header />
            <Hero />
            <Intro />
            <Services />
            <Process />
            <CTA />
            <AboutDentzy />
            <AboutDetails />
            <PerfectSmile />
            <PartnerSection />
            <ProductsIntro />
            <DentzyMakesUs />
            <FutureServices />
            <ConnectWithUs />
            <ContactForm />
            <Footer />
        </div>
    );
};

export default PCHome;
