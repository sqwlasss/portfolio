/**
 * Cristian Scebec - Digital Portfolio
 * Unit 3: A Digital Portfolio
 *
 * Plain ES5-compatible browser JavaScript. No framework, no build step, no
 * modules - the site has to open correctly by double-clicking index.html, and
 * ES modules are blocked by CORS on file:// URLs.
 *
 * Every feature here degrades safely: if the markup it needs is not on the
 * page, the initialiser returns without touching anything.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initNavShadow();
        initMobileMenu();
        initProjectFilters();
        initLightbox();
        initContactForm();
    });

    /* ----------------------------------------------------------------------
       Sticky navigation: add a shadow once the page has scrolled.
       Throttled with requestAnimationFrame and registered as a passive
       listener so it never blocks touch scrolling.
       ---------------------------------------------------------------------- */
    function initNavShadow() {
        var nav = document.querySelector('.site-nav');
        if (!nav) { return; }

        var ticking = false;
        var scrolled = false;

        function update() {
            var next = window.pageYOffset > 8;
            if (next !== scrolled) {
                scrolled = next;
                nav.classList.toggle('is-scrolled', scrolled);
            }
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }, { passive: true });

        update();
    }

    /* ----------------------------------------------------------------------
       Mobile menu.
       The trigger is a real <button>, so it is keyboard operable. When the
       menu is closed the list is display:none, which takes its links out of
       the tab order instead of leaving them focusable off-screen.
       ---------------------------------------------------------------------- */
    function initMobileMenu() {
        var toggle = document.querySelector('.nav-toggle');
        var list = document.getElementById('primary-navigation');
        if (!toggle || !list) { return; }

        function setOpen(open) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            list.classList.toggle('is-open', open);
            toggle.querySelector('.nav-toggle__label').textContent = open ? 'Close' : 'Menu';
        }

        toggle.addEventListener('click', function () {
            setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        });

        // Escape closes the menu and returns focus to the button that opened it.
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setOpen(false);
                toggle.focus();
            }
        });

        // Following a link closes the menu behind you.
        list.addEventListener('click', function (e) {
            if (e.target.closest('a')) { setOpen(false); }
        });

        // Clicking outside the open menu closes it.
        document.addEventListener('click', function (e) {
            if (toggle.getAttribute('aria-expanded') !== 'true') { return; }
            if (!list.contains(e.target) && !toggle.contains(e.target)) { setOpen(false); }
        });

        // Returning to a wide viewport must not leave a stale open state.
        window.addEventListener('resize', function () {
            if (window.innerWidth > 720) { setOpen(false); }
        });

        setOpen(false);
    }

    /* ----------------------------------------------------------------------
       Project filters.
       This genuinely shows and hides ledger rows, announces how many are
       visible, keeps the URL in step, and responds to the Back button.
       ---------------------------------------------------------------------- */
    function initProjectFilters() {
        var buttons = document.querySelectorAll('.filter-btn');
        /* Scoped to .ledger--units so the live-work ledger further up this page
           is never counted or hidden by the unit filters. */
        var items = document.querySelectorAll('.ledger--units .ledger__item');
        var count = document.getElementById('filter-count');
        if (!buttons.length || !items.length) { return; }

        function apply(filter, pushState) {
            var shown = 0;
            var i;

            for (i = 0; i < items.length; i++) {
                var tags = (items[i].getAttribute('data-status') || '') + ' ' +
                           (items[i].getAttribute('data-unit') || '');
                var match = filter === 'all' || tags.split(/\s+/).indexOf(filter) !== -1;
                items[i].classList.toggle('is-hidden', !match);
                if (match) { shown++; }
            }

            for (i = 0; i < buttons.length; i++) {
                var isOn = buttons[i].getAttribute('data-filter') === filter;
                buttons[i].setAttribute('aria-pressed', isOn ? 'true' : 'false');
            }

            if (count) {
                count.textContent = shown === items.length
                    ? 'Showing all ' + items.length + ' units.'
                    : 'Showing ' + shown + ' of ' + items.length + ' units.';
            }

            if (pushState && window.history && window.history.pushState) {
                var url = window.location.pathname +
                          (filter === 'all' ? '' : '?filter=' + encodeURIComponent(filter));
                window.history.pushState({ filter: filter }, '', url);
            }
        }

        function fromUrl() {
            var m = window.location.search.match(/[?&]filter=([^&]+)/);
            var wanted = m ? decodeURIComponent(m[1]) : 'all';
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute('data-filter') === wanted) { return wanted; }
            }
            return 'all';
        }

        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                apply(this.getAttribute('data-filter'), true);
            });
        }

        window.addEventListener('popstate', function () { apply(fromUrl(), false); });

        apply(fromUrl(), false);
    }

    /* ----------------------------------------------------------------------
       Lightbox.
       Opens from a real <button>, traps Tab inside the dialog, closes on
       Escape, on the backdrop and on the close button - but not on the image
       itself - and always returns focus to whatever opened it.
       ---------------------------------------------------------------------- */
    function initLightbox() {
        var triggers = document.querySelectorAll('.gallery__btn');
        var box = document.getElementById('lightbox');
        if (!triggers.length || !box) { return; }

        var img = box.querySelector('.lightbox__img');
        var cap = box.querySelector('.lightbox__cap');
        var closeBtn = box.querySelector('.lightbox__close');
        var lastFocused = null;

        // The trigger is passed in rather than read from document.activeElement:
        // not every browser focuses a <button> on click, and focus has to go
        // back to the right place when the lightbox closes.
        function open(trigger, src, alt, caption) {
            lastFocused = trigger;
            img.setAttribute('src', src);
            img.setAttribute('alt', alt);
            cap.textContent = caption || alt;
            box.classList.add('is-open');
            box.removeAttribute('aria-hidden');
            document.body.classList.add('is-locked');
            closeBtn.focus();
        }

        function close() {
            box.classList.remove('is-open');
            box.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('is-locked');
            // removeAttribute, not src = '' — an empty src makes the browser
            // re-request the page itself.
            img.removeAttribute('src');
            img.setAttribute('alt', '');
            if (lastFocused && lastFocused.focus) { lastFocused.focus(); }
        }

        for (var i = 0; i < triggers.length; i++) {
            triggers[i].addEventListener('click', function () {
                var picture = this.querySelector('img');
                if (!picture) { return; }
                open(
                    this,
                    this.getAttribute('data-full') || picture.getAttribute('src'),
                    picture.getAttribute('alt') || '',
                    this.getAttribute('data-caption') || ''
                );
            });
        }

        closeBtn.addEventListener('click', close);

        // Only the backdrop closes on click - clicking the picture does not.
        box.addEventListener('click', function (e) {
            if (e.target === box) { close(); }
        });

        box.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }
            // There is exactly one focusable control inside, so the trap is
            // simply: keep Tab on it.
            if (e.key === 'Tab') {
                e.preventDefault();
                closeBtn.focus();
            }
        });
    }

    /* ----------------------------------------------------------------------
       Contact form.
       A static site cannot post a message anywhere, and a form that silently
       swallows what someone typed is worse than no form. This one validates,
       then hands the completed message to the visitor's own email client with
       everything already filled in, and says plainly that that is what it
       does. The email address is also printed on the page for anyone whose
       browser has no mail client configured.
       ---------------------------------------------------------------------- */
    function initContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) { return; }

        var status = document.getElementById('form-status');
        var address = form.getAttribute('data-mailto');
        var fields = ['name', 'email', 'subject', 'message'].map(function (id) {
            return document.getElementById('field-' + id);
        }).filter(Boolean);

        // Turn off native validation so the accessible messages below are the
        // ones people actually get.
        form.setAttribute('novalidate', 'novalidate');

        function setError(input, message) {
            var box = document.getElementById(input.id + '-error');
            if (message) {
                input.setAttribute('aria-invalid', 'true');
                if (box) { box.textContent = message; box.classList.add('is-shown'); }
            } else {
                input.removeAttribute('aria-invalid');
                if (box) { box.textContent = ''; box.classList.remove('is-shown'); }
            }
        }

        function validate(input) {
            var value = input.value.trim();
            var label = input.getAttribute('data-label') || 'This field';

            if (!value) {
                setError(input, label + ' is required.');
                return false;
            }
            if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
                setError(input, 'Enter an email address in the form name@example.com.');
                return false;
            }
            setError(input, '');
            return true;
        }

        fields.forEach(function (input) {
            input.addEventListener('blur', function () { validate(input); });
            input.addEventListener('input', function () {
                if (input.getAttribute('aria-invalid') === 'true') { validate(input); }
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var valid = true;
            var firstBad = null;

            fields.forEach(function (input) {
                if (!validate(input)) {
                    valid = false;
                    if (!firstBad) { firstBad = input; }
                }
            });

            if (!valid) {
                if (status) { status.textContent = 'Some details are missing. Check the highlighted fields.'; }
                if (firstBad) { firstBad.focus(); }
                return;
            }

            var get = function (id) {
                var el = document.getElementById('field-' + id);
                return el ? el.value.trim() : '';
            };

            var body = 'From: ' + get('name') + ' (' + get('email') + ')\n\n' + get('message');
            var href = 'mailto:' + address +
                       '?subject=' + encodeURIComponent(get('subject')) +
                       '&body=' + encodeURIComponent(body);

            if (status) {
                status.textContent = 'Opening your email app with this message ready to send. ' +
                    'If nothing happens, email ' + address + ' directly.';
            }

            window.location.href = href;
        });
    }
}());
