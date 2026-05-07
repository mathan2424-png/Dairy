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
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                </div>
                <div class="modal-caption">${title}</div>
            `;
            mediaModal.classList.add('active');
        });
    });

    window.addEventListener('scroll', syncHeaderState, { passive: true });
    syncHeaderState();
    setupCountAnimations();
})();
