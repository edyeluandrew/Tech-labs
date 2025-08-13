document.addEventListener('DOMContentLoaded', () => {
    // Hide loading overlay after a delay
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 1000);
        }
    }, 3000);

    // Fade in page content
    document.body.style.opacity = '1';

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth',
                });

                // Close mobile menu on link click
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuBtn.textContent = '☰';
                }
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        if (scrollTop > 50) {
            header.style.cssText = `
                padding: 1rem 0;
                box-shadow: 0 2px 20px rgba(135, 206, 235, 0.2);
                background-color: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
            `;
        } else {
            header.style.cssText = `
                padding: 1.5rem 0;
                box-shadow: 0 2px 20px rgba(0,0,0,0.05);
                background-color: var(--white);
                backdrop-filter: none;
            `;
        }
    });

    // Intersection Observer for scroll animations
    const animateOnScroll = (selector, animationClass) => {
        const elements = document.querySelectorAll(selector);
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    };

    // Animate elements
    animateOnScroll('.service-card', 'animate');
    animateOnScroll('.value-card', 'animate');
    animateOnScroll('.team-member', 'animate');
    animateOnScroll('.objective-item', 'animate');

    // Mouse move 3D hover effect
    document.addEventListener('mousemove', e => {
        const cards = document.querySelectorAll('.service-card, .value-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) / 20;
            const deltaY = (e.clientY - centerY) / 20;

            if (rect.top < window.innerHeight && rect.bottom > 0) {
                card.style.transform = `
                    translateX(${deltaX}px)
                    translateY(${deltaY}px)
                    rotateX(${deltaY * 0.1}deg)
                    rotateY(${deltaX * 0.1}deg)
                `;
            }
        });
    });

    // Reset 3D card transform on mouse leave
    document.addEventListener('mouseleave', () => {
        document.querySelectorAll('.service-card, .value-card').forEach(card => {
            card.style.transform = '';
        });
    });

    // Contact form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const subject = document.getElementById('subject')?.value || '';
            const message = document.getElementById('message')?.value || '';

            try {
                const response = await fetch('https://tech-labs.onrender.com/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message || 'Message sent successfully!');
                    contactForm.reset();
                } else {
                    alert(data.error || 'Failed to send message.');
                }
            } catch (error) {
                alert('Error sending message, please try again later.');
                console.error('Error:', error);
            }
        });
    }
});
