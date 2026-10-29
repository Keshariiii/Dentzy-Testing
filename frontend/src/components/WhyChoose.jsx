'use client';
import React from 'react';
import { ShieldCheck, Clock, Layers, Headphones } from 'lucide-react';
import './WhyChoose.css';

const WHY_ITEMS = [
  {
    title: 'Quality Guarantee',
    desc: '5-10 years warranty on all restorations',
    Icon: ShieldCheck,
  },
  {
    title: 'Fast Turnaround',
    desc: '5-7 days standard, 2-3 days rush',
    Icon: Clock,
  },
  {
    title: 'Digital Workflow',
    desc: 'STL uploads for digital impressions',
    Icon: Layers,
  },
  {
    title: 'Dedicated Support',
    desc: 'Mon-Sat, 9 AM - 6 PM IST',
    Icon: Headphones,
  },
];

const WhyChoose = () => {
  return (
    <section className="why-choose-section section-padding" id="why-choose">
      <div className="container">
        <div className="why-choose-header text-center reveal from-bottom">
          <h2 className="why-choose-title">
            Why Choose <span>DENTZY?</span>
          </h2>
          <p className="why-choose-subtitle">
            Reliable lab craftsmanship engineered for modern clinical workflows
          </p>
        </div>

        <div className="why-choose-grid">
          {WHY_ITEMS.map((item, idx) => {
            const IconComponent = item.Icon;
            return (
              <div key={idx} className="why-choose-card reveal from-bottom">
                <div className="why-choose-icon-wrap">
                  <IconComponent size={24} strokeWidth={2} />
                </div>
                <h3 className="why-choose-card-title">{item.title}</h3>
                <p className="why-choose-card-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
