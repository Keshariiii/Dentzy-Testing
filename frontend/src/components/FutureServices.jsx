import React from 'react';
import './FutureServices.css';
import { FUTURE_SERVICES } from '../data/landingContent';

const FutureServices = () => {
    return (
        <section className="future-services">
            <div className="container">
                <p className="future-services-text">
                    {FUTURE_SERVICES.text}
                </p>
            </div>
        </section>
    );
};

export default FutureServices;
