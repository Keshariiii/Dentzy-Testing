'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import './Header.css';
const dentzyLogo = '/dentzy-logo-v2.png';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ['home', 'about', 'products', 'contact'];
    const observers = [];

    sectionIds.forEach((id) => {
      const el = id === 'home' ? document.body : document.getElementById(id);
      if (!el) return;
      const target = id === 'home' ? document.querySelector('#home') || document.querySelector('.hero') : el;
      if (!target) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(target);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    setMenuOpen(false);

    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    const headerEl = document.querySelector('.header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 80;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-content">
        <a href="#home" className="logo" onClick={(e) => scrollToSection(e, 'home')}>
          <img src={dentzyLogo} alt="Dentzy Logo" className="logo-img" />
        </a>

        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className={activeSection === 'home' ? 'active' : ''}>Home</a>
          <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className={activeSection === 'about' ? 'active' : ''}>About us</a>
          <a href="#products" onClick={(e) => scrollToSection(e, 'products')} className={activeSection === 'products' ? 'active' : ''}>Products</a>
          <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact us</a>

          {user ? (
            <div className="nav-user-info">
              <span className="nav-username">👤 {user.name}</span>
              <button
                id="logout-btn"
                className="btn-sm nav-logout"
                onClick={() => { logout(); router.push('/'); }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" id="nav-get-started-btn" className="btn-sm desktop-only">Get Started</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

