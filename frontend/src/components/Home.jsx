import React, { useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import Intro from './Intro';
import Services from './Services';
import Process from './Process';
import CTA from './CTA';
import AboutDentzy from './AboutDentzy';
import AboutDetails from './AboutDetails';
import PerfectSmile from './PerfectSmile';
import PartnerSection from './PartnerSection';
import ProductsIntro from './ProductsIntro';
import DentzyMakesUs from './DentzyMakesUs';
import FutureServices from './FutureServices';
import ConnectWithUs from './ConnectWithUs';
import ContactForm from './ContactForm';
import Footer from './Footer';
import { initScrollAnimation } from '../utils/scrollObserver';

const Home = () => {
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

export default Home;
