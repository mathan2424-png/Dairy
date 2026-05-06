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
            link.addEventListener('click', function () {
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

    window.addEventListener('scroll', syncHeaderState, { passive: true });
    syncHeaderState();
    setupCountAnimations();
})();
