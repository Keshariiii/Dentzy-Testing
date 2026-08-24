import React from 'react';
import './ProductsIntro.css';

const ProductsIntro = () => {
    return (
        <section className="products-intro-section section-padding" id="products">
            <video className="products-intro-video" autoPlay loop muted playsInline>
                <source src="/products-bg.mp4" type="video/mp4" />
            </video>
            <div className="products-intro-overlay"></div>
            <div className="container products-intro-content animate-on-scroll">
                <h2 className="products-title">Our PRODUC<span>T</span>S</h2>
                <p className="products-subtitle">Precision You Can Rely On</p>
            </div>
        </section>
    );
};

export default ProductsIntro;
