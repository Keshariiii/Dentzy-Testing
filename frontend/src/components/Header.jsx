'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { TwentyFirstIconButton } from './ui/twentyfirst-icon-button';
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
    <>
      {/* Backdrop rendered before header so header and nav are strictly on top */}
      {menuOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}

      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-content">
          <a href="#home" className="logo" onClick={(e) => scrollToSection(e, 'home')}>
            <img src={dentzyLogo} alt="Dentzy Logo" className="logo-img" />
          </a>

          <button
            className="mobile-menu-btn"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            title={menuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {menuOpen ? <X size={24} color="var(--dz-color-primary, #1e5038)" /> : <Menu size={24} color="var(--dz-color-primary, #1e5038)" />}
          </button>

          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className={activeSection === 'home' ? 'active' : ''}>Home</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className={activeSection === 'about' ? 'active' : ''}>About us</a>
            <a href="#products" onClick={(e) => scrollToSection(e, 'products')} className={activeSection === 'products' ? 'active' : ''}>Products</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact us</a>

            {user ? (
              <div className="nav-user-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="nav-username" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} />
                  {user.name}
                </span>
                <TwentyFirstIconButton
                  id="logout-btn"
                  icon={<LogOut size={16} />}
                  title="Logout"
                  ariaLabel="Logout"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                />
              </div>
            ) : (
              <div className="nav-auth-wrap">
                <Link href="/login" id="nav-get-started-btn" onClick={() => setMenuOpen(false)} aria-label="Get Started" title="Get Started" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <TwentyFirstIconButton
                    icon={<LogIn size={16} />}
                    title="Get Started"
                    ariaLabel="Get Started"
                    variant="primary"
                    size="sm"
                  />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
