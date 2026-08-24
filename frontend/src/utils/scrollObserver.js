/**
 * scrollObserver.js
 * Handles two animation systems:
 *   1. Legacy:  .animate-on-scroll  → adds .visible
 *   2. New:     .reveal, .reveal-stagger → adds .visible
 */
export const initScrollAnimation = () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Handle legacy animate-on-scroll elements
    const legacy = document.querySelectorAll('.animate-on-scroll');
    legacy.forEach((el) => observer.observe(el));

    // Handle new reveal system
    const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
};
