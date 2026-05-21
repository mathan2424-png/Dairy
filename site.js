(function () {
    const header = document.getElementById('main-header');

    if (!header) {
        return;
    }

    const menuButton = header.querySelector('.mobile-menu-btn');
    const navigation = header.querySelector('.nav-links');
    const menuIcon = menuButton ? menuButton.querySelector('i') : null;
    const mobileBreakpoint = 992;

    function setMenuOpen(isOpen) {
        if (!menuButton || !navigation) {
            return;
        }

        header.classList.toggle('nav-open', isOpen);
        menuButton.setAttribute('aria-expanded', String(isOpen));

        if (!isOpen) {
            navigation.querySelectorAll('.has-dropdown.active').forEach(function (item) {
                item.classList.remove('active');
            });
        }

        if (menuIcon) {
            menuIcon.classList.toggle('fa-bars', !isOpen);
            menuIcon.classList.toggle('fa-xmark', isOpen);
        }
    }

    function isMobileViewport() {
        return window.innerWidth <= mobileBreakpoint;
    }

    function syncHeaderState() {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }

    function parseCountValue(value) {
        const match = value.trim().match(/^([\d,.]+)\s*([KMB])?\s*(\+)?$/i);

        if (!match) {
            return null;
        }

        return {
            target: Number(match[1].replace(/,/g, '')),
            unit: (match[2] || '').toUpperCase(),
            plus: Boolean(match[3])
        };
    }

    function formatCountValue(value, config) {
        const roundedValue = Math.round(value);
        const suffix = config.unit + (config.plus ? '+' : '');

        return roundedValue.toLocaleString('en-IN') + suffix;
    }

    function animateCount(element) {
        const parsedValue = parseCountValue(element.textContent);

        if (!parsedValue || element.dataset.countupDone === 'true') {
            return;
        }

        element.dataset.countupDone = 'true';

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.textContent = formatCountValue(parsedValue.target, parsedValue);
            return;
        }

        const duration = 1800;
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = parsedValue.target * easedProgress;

            element.textContent = formatCountValue(currentValue, parsedValue);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    function setupCountAnimations() {
        const counters = Array.from(document.querySelectorAll('[data-countup]'));

        if (counters.length === 0) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCount);
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                animateCount(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.35
        });

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    if (menuButton && navigation) {
        menuButton.addEventListener('click', function () {
            setMenuOpen(!header.classList.contains('nav-open'));
        });

        navigation.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function (event) {
                const parentLi = link.parentElement;
                
                if (isMobileViewport() && parentLi.classList.contains('has-dropdown')) {
                    // Check if the click was on the link text (not children of the dropdown)
                    if (event.target === link || link.contains(event.target)) {
                        const dropdown = parentLi.querySelector('.dropdown');
                        if (dropdown) {
                            event.preventDefault();
                            const shouldOpen = !parentLi.classList.contains('active');
                            navigation.querySelectorAll('.has-dropdown.active').forEach(function (item) {
                                if (item !== parentLi) {
                                    item.classList.remove('active');
                                }
                            });
                            parentLi.classList.toggle('active', shouldOpen);
                            return;
                        }
                    }
                }

                if (isMobileViewport()) {
                    setMenuOpen(false);
                }
            });
        });

        document.addEventListener('click', function (event) {
            if (!isMobileViewport() || !header.classList.contains('nav-open')) {
                return;
            }

            if (!header.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        });

        window.addEventListener('resize', function () {
            if (!isMobileViewport()) {
                setMenuOpen(false);
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        const targetSelector = anchor.getAttribute('href');

        if (!targetSelector || targetSelector === '#') {
            return;
        }

        const target = document.querySelector(targetSelector);

        if (!target) {
            return;
        }

        anchor.addEventListener('click', function (event) {
            event.preventDefault();

            if (isMobileViewport()) {
                setMenuOpen(false);
            }

            const headerOffset = header.offsetHeight + 16;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

            window.scrollTo({
                top: Math.max(targetTop, 0),
                behavior: 'smooth'
            });
        });
    });

    // Lightbox & Video Modal Functionality
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'media-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">&times;</button>
                <div class="modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        function closeModal() {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.querySelector('.modal-body').innerHTML = '';
            }, 300);
        }

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        return modal;
    }

    const mediaModal = createModal();
    const modalBody = mediaModal.querySelector('.modal-body');

    // Handle Gallery Clicks
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-caption')?.textContent || '';
            
            modalBody.innerHTML = `
                <img src="${img.src}" alt="${img.alt}" class="modal-img">
                <div class="modal-caption">${caption}</div>
            `;
            mediaModal.classList.add('active');
        });
    });

    // Handle Video Clicks
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h4')?.textContent || 'Event Video';
            // Using a placeholder video for demonstration
            modalBody.innerHTML = `
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                </div>
                <div class="modal-caption">${title}</div>
            `;
            mediaModal.classList.add('active');
        });
    });

    // Dynamic Footer Loading with offline/CORS fallback
    async function loadFooter() {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (!footerPlaceholder) return;

        const footerHTML = `<footer class="footer">
    <div class="container footer-grid">
        <div class="footer-about">
            <img src="assets/logo.png" alt="India Dairy Show" class="footer-logo">
            <p>Leading the transformation of South Indian dairy industry through innovation and collaboration.</p>
            <div class="social-links">
                <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            </div>
        </div>
        <div class="footer-links">
            <h4>Quick Links</h4>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About Us</a></li>
                <li><a href="exhibitors.html">Exhibitor</a></li>
                <li><a href="visitors.html">Visitors</a></li>
                <li><a href="media.html">Media</a></li>
                <li><a href="contact.html">Contact Us</a></li>
            </ul>
        </div>
        <div class="footer-contact">
            <h4>Contact Us</h4>
            <div class="footer-info-item">
                <i class="fas fa-phone-alt"></i>
                <div class="footer-info-content">
                    <a href="tel:+914442142483">+91 44 4214 2483</a>
                </div>
            </div>
            <div class="footer-info-item">
                <i class="fas fa-mobile-alt"></i>
                <div class="footer-info-content">
                    <span><a href="tel:+919391391162">+91 93913 91162</a> / <a href="tel:+919941008371">+91 99410 08371</a></span>
                </div>
            </div>
            <div class="footer-info-item">
                <i class="fas fa-envelope"></i>
                <div class="footer-info-content">
                    <div class="email-list">
                        <a href="mailto:project2@prompttradefairs.com">project2@prompttradefairs.com</a>
                        <a href="mailto:prompttradefairs@gmail.com">prompttradefairs@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer-office">
            <h4>Head Office</h4>
            <div class="footer-info-item">
                <i class="fas fa-map-marker-alt"></i>
                <div class="footer-info-content">
                    <span>Prompt Tower, Plot No: 324, Ram Nagar South Extension 12th Street,
                        Off Radial Road,Near Kamakshi Hospital,Pallikaranai,
                        Chennai - 600 100, India.</span>
                </div>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="container">
            <div class="footer-bottom-links">
                <a href="payment-terms.html">Payment Terms</a>
                <span class="link-separator">&bull;</span>
                <a href="privacy-policy.html">Privacy Policy</a>
                <span class="link-separator">&bull;</span>
                <a href="refund-policy.html">Refund Policy</a>
            </div>
            <p>&copy; 2027 India Dairy Show. All rights reserved. | Developed & Maintained by <a
                    href="https://www.oceansoftwares.com/" target="_blank" rel="noopener noreferrer">Ocean Softwares</a></p>
        </div>
    </div>
</footer>`;

        try {
            const response = await fetch('footer.html');
            if (response.ok) {
                const html = await response.text();
                footerPlaceholder.innerHTML = html;
            } else {
                console.warn('Failed to fetch footer.html dynamically, using built-in fallback.');
                footerPlaceholder.innerHTML = footerHTML;
            }
        } catch (error) {
            console.warn('CORS or Network error fetching footer.html, using built-in fallback.');
            footerPlaceholder.innerHTML = footerHTML;
        }
    }

    window.addEventListener('scroll', syncHeaderState, { passive: true });
    syncHeaderState();
    setupCountAnimations();
    loadFooter();
})();

// Accordion Toggle Function
function toggleAccordion(header) {
    const item = header.parentElement;
    const container = item.parentElement;
    
    // Optional: Close other items
    container.querySelectorAll('.accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.remove('active');
        }
    });
    
    // Toggle current item
    item.classList.toggle('active');
}
