tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "tertiary": "#5d5d78",
                "error-container": "#fe8983",
                "surface-container": "#eaeff1",
                "surface-container-lowest": "#ffffff",
                "background": "#f8f9fa",
                "outline-variant": "#abb3b7",
                "inverse-surface": "#0c0f10",
                "on-tertiary": "#fbf7ff",
                "secondary-fixed-dim": "#d3d4db",
                "surface-container-low": "#f1f4f6",
                "tertiary-container": "#d9d7f8",
                "error-dim": "#4e0309",
                "on-primary-fixed": "#254067",
                "primary-fixed": "#d6e3ff",
                "inverse-primary": "#b3cdfd",
                "secondary": "#5d5f65",
                "secondary-fixed": "#e1e2e9",
                "on-tertiary-container": "#4a4a65",
                "surface-container-high": "#e3e9ec",
                "on-error-container": "#752121",
                "primary-dim": "var(--primary-dim)",
                "primary-container": "var(--primary-container)",
                "surface-tint": "#455f88",
                "surface-dim": "#d1dce0",
                "on-primary-container": "var(--on-primary-container)",
                "primary": "var(--primary)",
                "on-secondary-fixed": "#3d3f45",
                "on-surface": "#2b3437",
                "error": "#9f403d",
                "tertiary-fixed-dim": "#cbc9e9",
                "primary-fixed-dim": "#bfd5ff",
                "on-tertiary-fixed": "#373851",
                "on-background": "#2b3437",
                "on-primary-fixed-variant": "#425c85",
                "on-secondary": "#f8f8ff",
                "secondary-dim": "#515359",
                "on-surface-variant": "#586064",
                "surface": "#f8f9fa",
                "on-secondary-fixed-variant": "#5a5b61",
                "on-tertiary-fixed-variant": "#54546f",
                "outline": "#737c7f",
                "secondary-container": "#e1e2e9",
                "surface-bright": "#f8f9fa",
                "tertiary-dim": "#51516c",
                "surface-variant": "#dbe4e7",
                "on-secondary-container": "#505257",
                "surface-container-highest": "#dbe4e7",
                "tertiary-fixed": "#d9d7f8",
                "on-error": "#fff7f6",
                "inverse-on-surface": "#9b9d9e",
                "on-primary": "var(--on-primary)"
            },
            "borderRadius": {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            "fontFamily": {
                "headline": ["Manrope"],
                "body": ["Manrope"],
                "label": ["Manrope"]
            }
        },
    },
};

// Utils
const formatMins = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatProgress = (watched, duration) => {
    if (!watched || !duration || duration === 0) return 0;
    return Math.min(100, Math.floor((watched / duration) * 100));
};

const delay = ms => new Promise(res => setTimeout(res, ms));

// Custom UI Modal to replace native alerts/confirms
window.showAppModal = (title, message, isConfirm = false, onConfirm = null) => {
    const existing = document.getElementById('app-custom-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'app-custom-modal';
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000000]/60 backdrop-blur-sm opacity-0 transition-opacity duration-300';
    
    const box = document.createElement('div');
    box.className = 'bg-surface-container-lowest w-full max-w-sm rounded-[1.5rem] shadow-2xl p-8 border border-surface-container-highest/20 transform scale-95 transition-transform duration-300';
    
    box.innerHTML = `
        <h3 class="text-xl font-bold text-on-surface mb-3 tracking-tight">${title}</h3>
        <p class="text-sm text-on-surface-variant font-medium leading-relaxed mb-8 opacity-90">${message}</p>
        <div class="flex justify-end gap-3">
            ${isConfirm ? `<button id="modal-cancel-btn" class="px-6 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>` : ''}
            <button id="modal-confirm-btn" class="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary-dim transition-all shadow-md active:scale-95">${isConfirm ? 'Confirm' : 'Okay'}</button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    // Trigger animations
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        box.classList.remove('scale-95');
    });

    const close = (confirmed) => {
        overlay.classList.add('opacity-0');
        box.classList.add('scale-95');
        setTimeout(() => overlay.remove(), 300);
        if (confirmed && onConfirm) onConfirm();
    };

    document.getElementById('modal-confirm-btn').onclick = () => close(true);
    if (isConfirm) document.getElementById('modal-cancel-btn').onclick = () => close(false);
};

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname.toLowerCase();

    // Fetch user context if valid session
    let globalUser = null;
    if (path !== '/' && !path.endsWith('index.html')) {
        try {
            const res = await fetch('/api/me');
            if (res.ok) { 
                globalUser = await res.json(); 
                window.globalUser = globalUser;
                // Set subject theme
                if (globalUser.activeSubject) {
                    document.body.setAttribute('data-subject', globalUser.activeSubject);
                }
            }
        } catch (e) { console.warn('Could not load user profile'); }
    }

    // Inject Watermark to sidebars
    const sidebars = document.querySelectorAll('aside');
    sidebars.forEach(s => {
        const watermark = document.createElement('div');
        watermark.className = "mt-auto px-8 pt-8 flex justify-center opacity-30 hover:opacity-100 transition-opacity absolute bottom-8 left-0 right-0";
        watermark.innerHTML = `<a href="https://yassinr.me" target="_blank" class="text-[0.65rem] font-bold tracking-[0.2em] text-on-surface uppercase hover:text-primary transition-colors">Made by Yassin Ragab</a>`;
        s.appendChild(watermark);
    });

    // Highlight Active Sidebar Links
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const allLinks = document.querySelectorAll('aside nav a, #mobile-nav-overlay nav a');
    allLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('bg-primary/10', 'text-primary', 'font-bold');
            link.classList.remove('text-[#586064]', 'text-on-surface-variant');
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        }
    });

    // Mobile Navigation & Header Fixes
    const headerActions = document.getElementById('header-actions');
    const headerLeft = document.querySelector('header .flex.items-center');
    
    if (headerLeft) {
        const hamburger = document.createElement('button');
        hamburger.id = 'mobile-menu-toggle';
        hamburger.className = 'lg:hidden flex items-center justify-center w-10 h-10 -ml-2 mr-2 text-on-surface hover:bg-surface-container-high rounded-full transition-colors';
        hamburger.innerHTML = '<span class="material-symbols-outlined text-3xl">menu</span>';
        headerLeft.prepend(hamburger);
    }

    const initMobileNav = () => {
        // Clean up existing overlay if any
        document.getElementById('mobile-nav-overlay')?.remove();

        // Mobile Nav Overlay
        const mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobile-nav-overlay';
        mobileOverlay.className = 'fixed inset-0 bg-surface-container-lowest z-[100] flex flex-col p-8 transition-all duration-500 translate-x-full opacity-0 invisible';
        const subLabel = globalUser?.activeSubject ? `<p class="text-[0.6rem] text-primary tracking-widest mt-1 font-bold opacity-80">${globalUser.activeSubject} Course</p>` : `<p class="text-xs text-on-surface-variant tracking-widest mt-1 opacity-70">Learning Portal</p>`;

        mobileOverlay.innerHTML = `
            <div class="flex justify-between items-center mb-12">
                <div>
                    <h2 class="text-2xl font-light tracking-[0.2em] uppercase text-on-surface">Elementa</h2>
                    ${subLabel}
                </div>
                <button id="mobile-menu-close" class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
                    <span class="material-symbols-outlined text-3xl">close</span>
                </button>
            </div>
            <nav class="flex flex-col gap-4">
                <a href="dashboard.html" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-3xl">dashboard</span> Dashboard
                </a>
                <a href="video_lessons.html" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-3xl">subscriptions</span> Video Lessons
                </a>
                <a href="past_papers.html" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-3xl">folder_open</span> Past Papers
                </a>
                ${(globalUser && globalUser.role === 'admin') ? `
                <a href="admin.html" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-3xl">admin_panel_settings</span> Command Center
                </a>
                ` : ''}
                ${(globalUser && globalUser.subjects?.length > 1) ? `
                <button id="switch-subject-mobile" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-primary bg-primary/5 hover:bg-primary/10 transition-all text-left">
                    <span class="material-symbols-outlined text-3xl">swap_horiz</span> Switch Subject
                </button>
                ` : ''}
                <a href="settings.html" class="mobile-nav-link flex items-center gap-6 p-6 rounded-2xl text-xl font-bold tracking-tight text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-3xl">settings</span> Settings
                </a>
            </nav>
            <div class="mt-auto pt-8 border-t border-surface-container-highest/30">
                <button id="btn-logout-mobile" class="w-full p-6 flex items-center gap-6 rounded-2xl text-xl font-bold text-error hover:bg-error/5 transition-all text-left">
                    <span class="material-symbols-outlined text-3xl">logout</span> Sign Out
                </button>
                <p class="text-center text-[0.65rem] font-bold tracking-[0.2em] text-on-surface-variant uppercase mt-12 opacity-50">Made by Yassin Ragab</p>
            </div>
        `;
        document.body.appendChild(mobileOverlay);

        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('mobile-menu-close');
        const logoutMobile = document.getElementById('btn-logout-mobile');
        const switchSubjectMobile = document.getElementById('switch-subject-mobile');

        toggleBtn && toggleBtn.addEventListener('click', () => {
            mobileOverlay.classList.remove('translate-x-full', 'opacity-0', 'invisible');
            document.body.style.overflow = 'hidden';
        });
        closeBtn && closeBtn.addEventListener('click', () => {
            mobileOverlay.classList.add('translate-x-full', 'opacity-0', 'invisible');
            document.body.style.overflow = '';
        });
        logoutMobile && logoutMobile.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/index.html';
        });
        switchSubjectMobile && switchSubjectMobile.addEventListener('click', () => {
            showSubjectSelectionModal(globalUser.subjects);
        });

        // Re-highlight active links in mobile nav
        mobileOverlay.querySelectorAll('nav a').forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath) {
                link.classList.add('bg-primary/10', 'text-primary', 'font-bold');
                link.classList.remove('text-on-surface-variant');
            }
        });
    };

    initMobileNav();

    // Profile Dropdown logic
    if (headerActions) {
        // 1. Search Bar Restoration with Mobile Support
        if (!path.includes('dashboard.html') && !path.endsWith('/') && !path.endsWith('index.html')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = "flex items-center gap-2 mr-2";
            searchContainer.innerHTML = `
                <!-- Mobile Search Icon -->
                <button id="mobile-search-toggle" class="md:hidden flex items-center justify-center w-10 h-10 text-on-surface hover:bg-surface-container-high rounded-full transition-colors">
                    <span class="material-symbols-outlined">search</span>
                </button>
                
                <!-- Search Input Container -->
                <div id="search-input-wrapper" class="hidden md:flex relative group items-center">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all text-xl">search</span>
                    <input id="global-search" type="text" placeholder="Search papers..." class="w-full md:w-64 lg:w-96 bg-surface-container border-none focus:ring-2 focus:ring-primary/20 rounded-full py-2.5 pl-11 pr-4 text-xs font-bold transition-all shadow-inner"/>
                    <!-- Mobile Close Search (only if hidden toggle is used) -->
                    <button id="mobile-search-close" class="md:hidden ml-2 text-on-surface-variant hover:text-error transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;
            headerActions.prepend(searchContainer);
            
            const searchWrapper = document.getElementById('search-input-wrapper');
            const searchToggle = document.getElementById('mobile-search-toggle');
            const searchClose = document.getElementById('mobile-search-close');
            
            searchToggle && searchToggle.addEventListener('click', () => {
                searchWrapper.classList.remove('hidden');
                searchWrapper.classList.add('fixed', 'inset-0', 'z-[80]', 'bg-surface-container-lowest', 'px-6', 'flex', 'items-center', 'animate-in', 'fade-in', 'duration-300');
                document.getElementById('global-search').focus();
            });
            
            searchClose && searchClose.addEventListener('click', () => {
                searchWrapper.classList.add('hidden');
                searchWrapper.classList.remove('fixed', 'inset-0', 'z-[80]', 'bg-surface-container-lowest', 'px-6', 'flex', 'items-center');
            });
            
            // Search Logic
            const searchInput = document.getElementById('global-search');
            searchInput && searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('article, .bg-surface-container-lowest.p-6');
                cards.forEach(card => card.style.display = card.innerText.toLowerCase().includes(term) ? '' : 'none');
                document.querySelectorAll('#papers-list section').forEach(section => {
                    section.style.display = Array.from(section.querySelectorAll('.bg-surface-container-lowest.p-6')).some(c => c.style.display !== 'none') ? '' : 'none';
                });
            });
        }

        const displayName = globalUser ? (globalUser.display_name || globalUser.email.split('@')[0]) : 'Student';
        const roleName = globalUser && globalUser.role === 'admin' ? 'Admin' : 'Student';
        
        const subjectHexMap = {
            'Physics': '455f88',
            'Math': '8a2525',
            'Biology': '165a3c',
            'Chemistry': '543884'
        };
        const avatarColor = (globalUser && globalUser.activeSubject) ? (subjectHexMap[globalUser.activeSubject] || '455f88') : '455f88';

        const profileBtn = document.createElement('div');
        profileBtn.className = "flex items-center gap-3 lg:gap-4 cursor-pointer group p-1 lg:p-2 rounded-full hover:bg-primary/5 transition-all relative";
        profileBtn.innerHTML = `
            <div class="w-10 lg:w-12 h-10 lg:h-12 rounded-full overflow-hidden border-2 border-surface-container-highest shadow-sm group-hover:border-primary/30 transition-all">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${avatarColor}&color=fff" class="w-full h-full object-cover"/>
            </div>
            <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">${displayName}</span>
                <span class="text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">${roleName}</span>
            </div>
            <!-- Dropdown Menu -->
            <div class="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-highest/20 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-[60] overflow-hidden">
                <a href="settings.html" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-on-surface-variant hover:bg-primary/5 hover:text-primary"><span class="material-symbols-outlined text-lg">settings</span> Settings</a>
                <div class="border-t border-surface-container-highest/10"></div>
                <button id="btn-logout-desktop" class="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-error hover:bg-error/5"><span class="material-symbols-outlined text-lg">logout</span> Logout</button>
            </div>
        `;
        headerActions.appendChild(profileBtn);

        const logoutDesk = document.getElementById('btn-logout-desktop');
        logoutDesk && logoutDesk.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/index.html';
        });

        // --- START: Universal Subject Display & Switching (Header) ---
        const subjectLabel = document.getElementById('header-subject-label');
        if (subjectLabel && globalUser && globalUser.activeSubject) {
            subjectLabel.innerText = `${globalUser.activeSubject} / Edexcel IGCSE Portal`;
            subjectLabel.classList.remove('opacity-60');
            subjectLabel.classList.add('opacity-100', 'text-primary'); // Make it pop more
        }

        // Add Switch Subject Button to Header Actions (Desktop)
        if (headerActions && globalUser && globalUser.subjects && globalUser.subjects.length > 1) {
            const switchBtn = document.createElement('button');
            switchBtn.id = 'header-switch-subject';
            switchBtn.className = 'hidden lg:flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all group relative';
            switchBtn.innerHTML = `
                <span class="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500">swap_horiz</span>
                <span class="absolute top-full mt-2 right-0 bg-surface-container-highest text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Switch Subject</span>
            `;
            switchBtn.onclick = () => showSubjectSelectionModal(globalUser.subjects);
            headerActions.prepend(switchBtn);
        }
        // --- END: Universal Subject Display & Switching (Header) ---

        // Hide non-admin routes if admin
        if (globalUser && globalUser.role === 'admin') {
            document.querySelectorAll('a[href="past_papers.html"]').forEach(el => el.remove());
        }
    }

    // -----------------------------------------
    // PAGE SPECIFIC RENDERS
    // -----------------------------------------
    
    // DASHBOARD
    const dashHero = document.getElementById('hero-latest');
    const upcomingList = document.getElementById('upcoming-exams-list');
    
    if (dashHero) {
        // --- Exoskeleton Injections ---
        if (upcomingList) {
            upcomingList.innerHTML = `
                <div class="flex items-center gap-4 shrink-0">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="skeleton skeleton-box h-6 w-48"></div>
                        <div class="skeleton skeleton-box h-3 w-24"></div>
                    </div>
                </div>
                <div class="flex items-center gap-4 shrink-0 mt-4">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="skeleton skeleton-box h-6 w-32"></div>
                        <div class="skeleton skeleton-box h-3 w-16"></div>
                    </div>
                </div>
            `;
        }
        
        const grid = document.getElementById('history-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="bg-surface-container border border-surface-container-highest/20 rounded-[2rem] p-6 flex flex-col gap-4">
                    <div class="skeleton skeleton-box w-full aspect-video rounded-xl"></div>
                    <div class="skeleton skeleton-box h-4 w-1/3"></div>
                    <div class="skeleton skeleton-box h-6 w-3/4"></div>
                </div>
                <div class="bg-surface-container border border-surface-container-highest/20 rounded-[2rem] p-6 flex flex-col gap-4 hidden md:flex">
                    <div class="skeleton skeleton-box w-full aspect-video rounded-xl"></div>
                    <div class="skeleton skeleton-box h-4 w-1/3"></div>
                    <div class="skeleton skeleton-box h-6 w-3/4"></div>
                </div>
            `;
        }

        dashHero.innerHTML = `
            <div class="skeleton skeleton-box w-full h-72 lg:h-[500px]"></div>
            <div class="absolute bottom-0 left-0 right-0 p-6 lg:p-12 z-10 flex flex-col justify-end text-left gap-3">
                <div class="skeleton skeleton-box h-4 w-32"></div>
                <div class="skeleton skeleton-text h-10 w-2/3 mt-2"></div>
                <div class="skeleton skeleton-text h-3 w-1/3 mt-2"></div>
            </div>
        `;
        // -----------------------------

        const [res] = await Promise.all([
            fetch('/api/dashboard'),
            delay(1200) // enforce 1.2s minimum shimmer
        ]);

        if (res.status === 401) { window.location.href = '/index.html'; return; }
        const data = await res.json();
        window.globalUser = data.user;
        const user = data.user;

        // --- Subject Selection Logic ---
        if (user.role === 'student') {
            const hasMultiple = user.subjects && user.subjects.length > 1;
            const hasActive = user.activeSubject;
            
            if (hasMultiple && !hasActive) {
                document.body.classList.add('overflow-hidden');
                document.querySelector('main')?.classList.add('hidden');
                document.querySelector('aside')?.classList.add('hidden');
                document.querySelector('header')?.classList.add('hidden');
                showSubjectSelectionModal(user.subjects);
                // Make the background opaque
                const modal = document.getElementById('subject-selection-modal');
                modal.classList.replace('bg-surface-container-lowest/80', 'bg-surface-container-lowest');
                modal.classList.replace('backdrop-blur-3xl', 'backdrop-blur-none');
                return; // Stop init until subject picked
            }
        }

        // --- Update Sidebar/Header with Active Subject ---
        const asideHeader = document.querySelector('aside .px-8');
        if (asideHeader && user.activeSubject) {
            // Remove any existing subject label to avoid duplicates on re-init
            const existingLabel = asideHeader.querySelector('.subject-label');
            if (existingLabel) existingLabel.remove();

            const labelContainer = document.createElement('div');
            labelContainer.className = "subject-label mt-2";
            labelContainer.innerHTML = `
                <p class="text-[0.65rem] text-primary tracking-[0.2em] font-bold uppercase opacity-80 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[10px]">auto_awesome</span> ${user.activeSubject} Course
                </p>
            `;
            asideHeader.appendChild(labelContainer);
        }

        // 1. Account Greeting & Subtitle Styling
        const greetingHeader = document.getElementById('user-greeting');
        if (greetingHeader && data.user) {
            const name = data.user.display_name || data.user.email.split('@')[0];
            greetingHeader.innerHTML = `Hi, <span class="text-primary">${name}</span>!`;
        }
        
        // 2. Dashboard Upcoming Exams Sync
        const historyTitle = document.querySelector('main h2.text-2xl');
        if (historyTitle && !historyTitle.querySelector('.sync-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sync-badge inline-flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[0.6rem] font-bold uppercase tracking-widest opacity-80';
            badge.innerHTML = `<span class="material-symbols-outlined text-[0.8rem]" style="font-variation-settings: 'FILL' 1;">cloud_done</span> Account Synced`;
            historyTitle.appendChild(badge);
        }

        if (upcomingList) {
            upcomingList.innerHTML = '';
            if (data.upcomingExams && data.upcomingExams.length > 0) {
                data.upcomingExams.forEach(exam => {
                    const dateStr = exam.exam_date ? new Date(exam.exam_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "No Date";
                    const el = document.createElement('div');
                    el.className = "flex items-center gap-4 shrink-0";
                    el.innerHTML = `
                        <div class="flex flex-col">
                            <h5 class="text-xl font-bold text-primary flex items-center gap-3">${exam.title} <span class="text-[0.6rem] bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">${dateStr}</span></h5>
                            <p class="text-[0.65rem] font-bold text-on-surface-variant uppercase tracking-wider opacity-60">${exam.subtitle}</p>
                        </div>
                        <span class="ml-auto material-symbols-outlined text-primary/40">calendar_month</span>
                    `;
                    upcomingList.appendChild(el);
                });
            } else {
                upcomingList.innerHTML = `
                    <div class="flex items-center gap-4 opacity-50">
                        <div class="flex flex-col">
                            <h5 class="text-lg font-bold text-on-surface">No Exams</h5>
                            <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Unscheduled</p>
                        </div>
                    </div>
                `;
            }
        }

        // 3. Hero Content Injection
        if (data.lastOpened) {
            let p = formatProgress(data.lastOpened.watched_seconds, data.lastOpened.duration_seconds);
            dashHero.innerHTML = `
                <img alt="${data.lastOpened.title}" class="w-full h-72 lg:h-[500px] object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80"/>
                <div class="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="w-20 h-20 bg-surface-container-lowest/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-primary scale-150" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-6 lg:p-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 flex flex-col justify-end text-left">
                    <div class="flex items-center gap-4 text-white mb-3">
                        <span class="px-2.5 py-1 bg-error rounded uppercase tracking-widest text-[0.6rem] font-bold shadow-md">Resume Walkthrough</span>
                        <span class="text-xs lg:text-sm font-semibold tracking-wide drop-shadow-md">${data.lastOpened.series}</span>
                    </div>
                    <h3 class="text-3xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-lg mb-4">${data.lastOpened.title}</h3>
                    <div class="w-full bg-white/30 h-1.5 rounded-full overflow-hidden shadow-sm">
                        <div class="bg-primary h-full rounded-full transition-all duration-1000" style="width: ${p}%;"></div>
                    </div>
                    <div class="flex justify-between text-[0.65rem] text-white/80 mt-2 font-bold tracking-widest uppercase">
                        <span>Watch Progress</span>
                        <span>${p}%</span>
                    </div>
                </div>
            `;
            dashHero.onclick = () => window.location.href = `player.html?id=${data.lastOpened.id}`;
        } else {
            // "New User" Hero State
            dashHero.innerHTML = `
                <div class="flex flex-col items-center justify-center text-center p-12 max-w-sm">
                    <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                        <span class="material-symbols-outlined text-4xl">local_library</span>
                    </div>
                    <h3 class="text-2xl font-bold text-on-surface tracking-tight mb-2">Welcome to your Portal</h3>
                    <p class="text-sm text-on-surface-variant mb-8 leading-relaxed">It looks like you haven't started any lessons yet. Visit the Library to find your first walkthrough.</p>
                    <a href="video_lessons.html" class="bg-primary text-on-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[0.65rem] hover:scale-105 transition-transform">Browse Library</a>
                </div>
            `;
            dashHero.classList.remove('cursor-pointer');
            dashHero.onclick = null;
        }

        const gridHistory = document.getElementById('history-grid');
        if (gridHistory) {
            if (data.history && data.history.length > 0) {
                gridHistory.innerHTML = '';
                data.history.forEach(item => {
                    let p = formatProgress(item.watched_seconds, item.duration_seconds);
                    gridHistory.innerHTML += `
                    <div class="group cursor-pointer" onclick="window.location.href='player.html?id=${item.id}'">
                        <div class="aspect-video bg-surface-container border border-surface-container-highest/20 rounded-xl mb-4 relative overflow-hidden transition-transform duration-500 hover:-translate-y-1">
                            <img src="https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80" class="w-full h-full object-cover mix-blend-luminosity opacity-50 group-hover:scale-105 transition-transform duration-700"/>
                            <span class="absolute bottom-3 right-3 bg-surface-container-highest/80 backdrop-blur-sm text-on-surface px-2 py-1 rounded text-xs font-bold tracking-wider">${p}%</span>
                            <div class="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span class="material-symbols-outlined text-white scale-150" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                            </div>
                            <div class="w-full absolute bottom-0 bg-surface/30 h-1"><div class="bg-primary h-full" style="width: ${p}%"></div></div>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">${item.title}</h4>
                            <div class="flex items-center gap-2 text-on-surface-variant font-medium text-[0.65rem] uppercase tracking-widest opacity-80">
                                <p>${item.series}</p>
                                <span class="w-1 h-1 bg-on-surface-variant/30 rounded-full"></span>
                                <p>${item.duration_seconds > 0 ? formatMins(item.duration_seconds) : 'Duration loading...'}</p>
                            </div>
                        </div>
                    </div>`;
                });
            } else {
                grid.innerHTML = `
                    <div class="col-span-full py-16 flex flex-col items-center justify-center opacity-30">
                        <span class="material-symbols-outlined text-5xl mb-4">history</span>
                        <p class="text-[0.65rem] font-bold uppercase tracking-[0.2em]">No history recorded yet</p>
                    </div>
                `;
            }
        }

        // 5. Stats Update
        if (data.stats) {
            const perc = data.stats.total > 0 ? Math.floor((data.stats.completed / data.stats.total) * 100) : 0;
            const statsBlock = document.querySelector('.bg-surface-container-low.p-8.rounded-xl');
            if (statsBlock) {
                statsBlock.innerHTML = `
                    <h4 class="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-on-surface-variant/60 mb-6">Revision Status</h4>
                    <div class="space-y-4">
                        <div class="flex justify-between text-xs">
                            <span class="text-on-surface font-semibold">Syllabus Coverage</span>
                            <span class="font-bold text-primary">${perc}%</span>
                        </div>
                        <div class="w-full h-1.5 bg-surface-container-highest overflow-hidden rounded-full">
                            <div class="bg-primary h-full rounded-full transition-all duration-1000 shadow-sm" style="width: ${perc}%"></div>
                        </div>
                        <p class="text-[0.7rem] text-on-surface-variant mt-4 leading-relaxed font-medium">You have mastered ${data.stats.completed} modules out of ${data.stats.total} total Syllabus sections. Continue your journey to excellence.</p>
                    </div>
                `;
            }
        }
    }

    // VIDEO LESSONS PAGE
    const lessonsGrid = document.getElementById('lessons-grid');
    if (lessonsGrid) {
        let currentPage = 1;
        const itemsPerPage = 12; // 4x3 grid
        let allPapers = [];
        let currentSort = 'date_desc';
        let currentSubject = 'all';

        const renderGrid = async (sortValue = 'date_desc') => {
            currentSort = sortValue;
            // Skeleton Injection (12 cards)
            lessonsGrid.innerHTML = Array(itemsPerPage).fill(`
                <article class="group">
                    <div class="skeleton skeleton-box aspect-video w-full rounded-xl mb-4 border border-surface-container-highest/20"></div>
                    <div class="skeleton skeleton-text h-5 w-3/4 mb-2"></div>
                    <div class="skeleton skeleton-text h-3 w-1/4"></div>
                </article>
            `).join('');

            const url = (globalUser && globalUser.role === 'admin') 
                ? `/api/papers?sort=${sortValue}&subject=${currentSubject}`
                : `/api/papers?sort=${sortValue}`;

            const [res] = await Promise.all([
                fetch(url),
                delay(1000)
            ]);
            const data = await res.json();
            allPapers = data.papers || [];
            displayPage();
        };

        const displayPage = () => {
            const isMobile = window.innerWidth < 1024;
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pagePapers = isMobile ? allPapers : allPapers.slice(start, end);
            
            lessonsGrid.innerHTML = '';
            
            if (pagePapers.length === 0) {
                lessonsGrid.innerHTML = '<p class="col-span-full py-12 text-center opacity-50 italic">No lessons found.</p>';
            }

            pagePapers.forEach(paper => {
                let prog = formatProgress(paper.watched_seconds, paper.duration_seconds);
                const card = document.createElement('article');
                card.className = 'group cursor-pointer';
                card.onclick = () => window.location.href = `player.html?id=${paper.id}`;
                card.innerHTML = `
                    <div class="relative aspect-video overflow-hidden rounded-xl bg-surface-container-highest mb-4 border border-surface-container-highest/20 transition-all duration-500 hover:-translate-y-1 shadow-sm">
                        <video class="thumb-vid w-full h-full object-cover mix-blend-luminosity opacity-70 group-hover:mix-blend-normal transition-all duration-700 group-hover:scale-105" muted preload="metadata" data-src="${paper.video_url}"></video>
                        <div class="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-white scale-150" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        </div>
                        <div class="absolute top-0 left-0 right-0 p-4">
                            <div class="w-full bg-black/20 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
                                <div class="bg-primary h-full" style="width: ${prog}%"></div>
                            </div>
                        </div>
                        <span class="absolute bottom-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface px-2 py-1 rounded text-[0.6rem] font-bold tracking-widest uppercase">${prog}% Done</span>
                    </div>
                    <h3 class="text-sm font-bold tracking-tight text-on-surface mb-1 group-hover:text-primary transition-colors">${paper.title}</h3>
                    <p class="duration-label text-on-surface-variant font-medium text-[0.65rem] uppercase tracking-widest">${paper.duration_seconds > 0 ? formatMins(paper.duration_seconds) : 'Loading duration...'}</p>
                `;
                lessonsGrid.appendChild(card);
                
                // Lazy load duration
                const video = card.querySelector('video');
                const label = card.querySelector('.duration-label');
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        observer.disconnect();
                        video.src = video.dataset.src;
                        video.addEventListener('loadedmetadata', () => {
                            if (video.duration) {
                                label.textContent = `${formatMins(video.duration)} duration`;
                                if (!paper.duration_seconds) {
                                    fetch(`/api/papers/${paper.id}/duration`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durationSeconds: video.duration }) }).catch(()=>null);
                                }
                            }
                            video.currentTime = Math.min(10, video.duration * 0.1);
                        }, { once: true });
                    }
                }, { threshold: 0.1 });
                observer.observe(card);
            });

            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const updatePagination = () => {
            const totalPages = Math.ceil(allPapers.length / itemsPerPage);
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');
            const pageInfo = document.getElementById('page-info');
            const counter = document.getElementById('records-counter');

            if (prevBtn) prevBtn.disabled = currentPage === 1;
            if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
            if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${Math.max(1, totalPages)}`;
            if (counter) counter.textContent = `${allPapers.length} Records Found`;
        };

        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        prevBtn && prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayPage();
            }
        });

        nextBtn && nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allPapers.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayPage();
            }
        });

        const sortFilter = document.getElementById('sort-filter');
        sortFilter && sortFilter.addEventListener('change', (e) => {
            currentPage = 1;
            renderGrid(e.target.value);
        });

        // Admin Subject Filter Injection
        if (globalUser && globalUser.role === 'admin' && headerActions) {
            const filterContainer = document.createElement('div');
            filterContainer.className = 'flex items-center gap-2';
            filterContainer.innerHTML = `
                <span class="text-[0.6rem] font-bold uppercase tracking-widest opacity-50 hidden sm:inline">Portal:</span>
                <select id="admin-video-subject-filter" class="bg-surface-container-high border-none rounded-lg text-[0.65rem] font-bold uppercase tracking-wider px-3 py-2 cursor-pointer focus:ring-1 focus:ring-primary/20">
                    <option value="all">All Subjects</option>
                    <option value="Physics">Physics</option>
                    <option value="Math">Math</option>
                    <option value="Biology">Biology</option>
                    <option value="Chemistry">Chemistry</option>
                </select>
            `;
            headerActions.prepend(filterContainer);
            
            const adminFilter = document.getElementById('admin-video-subject-filter');
            adminFilter.addEventListener('change', (e) => {
                currentSubject = e.target.value;
                currentPage = 1;
                renderGrid(currentSort);
            });
        }

        renderGrid();
    }

    // PAST PAPERS LIST
    const papersContainer = document.getElementById('papers-list');
    if (papersContainer) {
        const renderPapersList = async (sort = 'date_desc') => {
            // Skeleton Injection
            papersContainer.innerHTML = Array(3).fill(`
                <section class="mb-12">
                    <div class="skeleton skeleton-text h-10 w-64 mb-8"></div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="skeleton skeleton-box h-48 w-full bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-highest/20"></div>
                        <div class="skeleton skeleton-box h-48 w-full bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-highest/20"></div>
                    </div>
                </section>
            `).join('');

            const [res] = await Promise.all([
                fetch(`/api/papers?sort=${sort}`),
                delay(1200)
            ]);
            
            const data = await res.json();
            if (papersContainer && data.papers) {
                papersContainer.innerHTML = '';
                const sorted = data.papers.reduce((acc, p) => {
                    if (!acc[p.series]) acc[p.series] = [];
                    acc[p.series].push(p);
                    return acc;
                }, {});
                
                Object.keys(sorted).forEach(series => {
                    let section = `<section class="mb-12"><h3 class="text-xl font-bold text-on-surface mb-6 border-b border-surface-container-highest pb-4">${series}</h3><div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
                    sorted[series].forEach(p => {
                        let prog = formatProgress(p.watched_seconds, p.duration_seconds);
                        section += `
                            <div class="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-highest/20 shadow-sm hover:shadow-md transition-all group">
                                <div class="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 class="text-sm font-bold text-on-surface mb-2">${p.title}</h4>
                                        <div class="flex items-center gap-3">
                                            <div class="w-16 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                                                <div class="bg-primary h-full" style="width: ${prog}%"></div>
                                            </div>
                                            <span class="text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest">${prog}%</span>
                                        </div>
                                    </div>
                                    <a href="player.html?id=${p.id}" class="text-[0.6rem] font-bold uppercase tracking-widest bg-primary text-on-primary px-4 py-2 rounded-full hover:bg-primary-dim transition-colors">Start Lesson</a>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <a href="${p.pdf_url}" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-primary hover:text-white transition-all text-xs font-bold no-underline text-on-surface"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-lg">description</span> Question Paper</div> <span class="material-symbols-outlined text-lg">download</span></a>
                                    <a href="${p.ms_url}" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-primary hover:text-white transition-all text-xs font-bold no-underline text-on-surface"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-lg">check_circle</span> Marking Scheme</div> <span class="material-symbols-outlined text-lg">download</span></a>
                                </div>
                            </div>
                        `;
                    });
                    section += `</div></section>`;
                    papersContainer.innerHTML += section;
                });
            }
        };
        const sf = document.getElementById('sort-filter');
        sf && sf.addEventListener('change', (e) => renderPapersList(e.target.value));
        renderPapersList();
    }

    // PLAYER PAGE
    const video = document.getElementById('main-video');
    if (video) {
        const urlParams = new URLSearchParams(window.location.search);
        const paperId = parseInt(urlParams.get('id') || '1');
        
        // UI Elements
        const wrapper = document.getElementById('player-wrapper');
        const playBtn = document.getElementById('play-pause');
        const playIcon = playBtn.querySelector('span');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const progressThumb = document.getElementById('progress-thumb');
        const currentTimeEle = document.getElementById('current-time');
        const durationEle = document.getElementById('total-duration');
        const volumeSlider = document.getElementById('volume-slider');
        const speedBtn = document.getElementById('speed-btn');
        const speedIndicator = document.getElementById('speed-indicator');
        const centralPlayIcon = document.getElementById('central-play-icon');
        const fsToggle = document.getElementById('fullscreen-toggle');
        const navContainer = document.getElementById('player-nav-container');
        const resourceContainer = document.getElementById('player-resources-container');

        const res = await fetch('/api/papers');
        const data = await res.json();
        
        // Sort same as video_lessons to ensure Next/Prev make sense
        const sortedPapers = [...data.papers].sort((a,b) => {
            const dateA = new Date(a.exam_date);
            const dateB = new Date(b.exam_date);
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            return a.paper > b.paper ? -1 : 1;
        });

        const paperIdx = sortedPapers.findIndex(p => p.id === paperId);
        const paper = sortedPapers[paperIdx];
        
        if (paper) {
            const titleEle = document.getElementById('lesson-title');
            const seriesEle = document.getElementById('top-subtitle');
            const descEle = document.getElementById('lesson-desc');
            const notesContainer = document.getElementById('teacher-notes-container');
            const notesEle = document.getElementById('teacher-notes');
            
            if (titleEle) titleEle.textContent = paper.title;
            if (seriesEle) seriesEle.textContent = paper.series;
            if (descEle) descEle.textContent = `Master the ${paper.series} with our high-fidelity video walkthrough. Use the Quick Resources to download the official Question Paper and Mark Scheme for a complete revision experience.`;
            
            if (notesContainer && notesEle) {
                if (paper.teacher_insights && paper.teacher_insights.trim().length > 0) {
                    notesEle.textContent = paper.teacher_insights;
                    if (paper.insights_header && paper.insights_header.trim().length > 0) {
                        const h3 = notesContainer.querySelector('span.text-\\[0\\.65rem\\]');
                        if (h3) h3.textContent = paper.insights_header;
                    }
                    setTimeout(() => notesContainer.classList.remove('opacity-0', 'translate-y-4'), 800);
                } else {
                    notesContainer.style.display = 'none'; // Hide if no insights
                }
            }

            video.src = paper.video_url;

            // 1. Navigation Rendering
            if (navContainer) {
                const prevPaper = sortedPapers[paperIdx + 1]; // Because sorted descending
                const nextPaper = sortedPapers[paperIdx - 1];
                
                navContainer.innerHTML = `
                    <div class="flex flex-col gap-6">
                        <a href="video_lessons.html" class="flex items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-all">
                            <span class="material-symbols-outlined text-sm">arrow_back</span> 
                            Back to Library
                        </a>
                        <div class="h-px bg-on-surface/5 w-full"></div>
                        <div class="flex flex-col gap-3">
                            ${nextPaper ? `<a href="player.html?id=${nextPaper.id}" class="flex items-center justify-between p-4 bg-white/5 hover:bg-primary/20 border border-white/5 rounded-2xl transition-all group">
                                <div class="flex flex-col">
                                    <span class="text-[0.6rem] uppercase tracking-widest opacity-40 font-bold">Next Exam</span>
                                    <span class="text-xs font-bold line-clamp-1">${nextPaper.title}</span>
                                </div>
                                <span class="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">chevron_right</span>
                            </a>` : ''}
                            ${prevPaper ? `<a href="player.html?id=${prevPaper.id}" class="flex items-center gap-4 p-4 bg-white/5 hover:bg-primary/20 border border-white/5 rounded-2xl transition-all group">
                                <span class="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">chevron_left</span>
                                <div class="flex flex-col">
                                    <span class="text-[0.6rem] uppercase tracking-widest opacity-40 font-bold">Previous Exam</span>
                                    <span class="text-xs font-bold line-clamp-1">${prevPaper.title}</span>
                                </div>
                            </a>` : ''}
                        </div>
                    </div>
                `;
                navContainer.classList.remove('opacity-0', 'translate-y-4');
            }

            // 2. Resources Rendering
            if (resourceContainer) {
                resourceContainer.innerHTML = `
                    <div class="flex flex-col gap-6">
                        <h3 class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">Exam Resources</h3>
                        <div class="grid grid-cols-1 gap-3">
                            <a href="${paper.pdf_url}" class="flex items-center gap-4 p-4 bg-surface-container-high/40 hover:bg-surface-container-high rounded-2xl transition-all border border-transparent hover:border-primary/20">
                                <span class="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">description</span>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold">Question Paper</span>
                                    <span class="text-[0.6rem] opacity-50 font-medium uppercase tracking-widest">PDF Document</span>
                                </div>
                            </a>
                            <a href="${paper.ms_url}" class="flex items-center gap-4 p-4 bg-surface-container-high/40 hover:bg-surface-container-high rounded-2xl transition-all border border-transparent hover:border-primary/20">
                                <span class="material-symbols-outlined text-secondary p-2 bg-secondary/10 rounded-lg">rule</span>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold">Mark Scheme</span>
                                    <span class="text-[0.6rem] opacity-50 font-medium uppercase tracking-widest">Official MS</span>
                                </div>
                            </a>
                            <a href="${paper.ma_url}" class="flex items-center gap-4 p-4 bg-surface-container-high/40 hover:bg-surface-container-high rounded-2xl transition-all border border-transparent hover:border-primary/20">
                                <span class="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">edit_note</span>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold">Model Answer</span>
                                    <span class="text-[0.6rem] opacity-50 font-medium uppercase tracking-widest">Atelier Solutions</span>
                                </div>
                            </a>
                        </div>
                    </div>
                `;
                resourceContainer.classList.remove('opacity-0', 'translate-y-4');
            }

            const updateMetadata = () => {
                durationEle.textContent = formatMins(video.duration);
                if (paper.watched_seconds > 0 && video.currentTime === 0) {
                    video.currentTime = paper.watched_seconds;
                }
            };

            video.addEventListener('loadedmetadata', updateMetadata);
            if (video.readyState >= 1) updateMetadata();

            const togglePlay = () => {
                if (video.paused) {
                    video.play();
                    playIcon.textContent = 'pause';
                    centralPlayIcon.classList.add('opacity-0', 'scale-150');
                } else {
                    video.pause();
                    playIcon.textContent = 'play_arrow';
                    centralPlayIcon.classList.remove('opacity-0', 'scale-150');
                    centralPlayIcon.style.opacity = '1';
                    setTimeout(() => { if (video.paused) centralPlayIcon.style.opacity = '0'; }, 500);
                }
            };

            video.onclick = togglePlay;
            playBtn.onclick = togglePlay;

            video.addEventListener('timeupdate', () => {
                const percent = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${percent}%`;
                progressThumb.style.left = `${percent}%`;
                currentTimeEle.textContent = formatMins(video.currentTime);
                
                // Auto-save logic
                const now = Math.floor(video.currentTime);
                if (now > 0 && now % 5 === 0) {
                    fetch('/api/progress', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ paperId, watchedSeconds: now }) }).catch(()=>null);
                }
            });

            progressContainer.onclick = (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                video.currentTime = pos * video.duration;
            };

            volumeSlider.oninput = (e) => {
                video.volume = e.target.value;
                video.muted = (video.volume === "0");
            };

            // Speed Menu
            document.querySelectorAll('.speed-opt').forEach(opt => {
                opt.onclick = () => {
                    const s = parseFloat(opt.dataset.speed);
                    video.playbackRate = s;
                    speedBtn.textContent = s + 'x';
                };
            });

            // Fullscreen
            fsToggle.onclick = () => {
                if (!document.fullscreenElement) wrapper.requestFullscreen();
                else document.exitFullscreen();
            };

            // Keyboard Shortcuts & x2 Hold
            let spaceDown = false;
            let spaceHoldTimer = null;
            let originalRate = 1;

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (spaceDown) return;
                    spaceDown = true;
                    
                    spaceHoldTimer = setTimeout(() => {
                        if (spaceDown) {
                            originalRate = video.playbackRate;
                            video.playbackRate = 2;
                            speedIndicator.classList.remove('opacity-0');
                        }
                    }, 400);
                }
                if (e.code === 'ArrowRight') video.currentTime += 10;
                if (e.code === 'ArrowLeft') video.currentTime -= 10;
            });

            window.addEventListener('keyup', (e) => {
                if (e.code === 'Space') {
                    clearTimeout(spaceHoldTimer);
                    if (video.playbackRate === 2 && spaceDown) {
                        video.playbackRate = originalRate;
                        speedIndicator.classList.add('opacity-0');
                    } else {
                        togglePlay();
                    }
                    spaceDown = false;
                }
            });
        }
    }

    // ADMIN DASHBOARD
    if (document.getElementById('admin-students-list')) {
        const studentsList = document.getElementById('admin-students-list');
        const papersList = document.getElementById('admin-papers-list');
        const searchInput = document.getElementById('admin-paper-search');
        const subjectFilterSelect = document.getElementById('admin-subject-filter');
        
        let allStudents = [];
        let allPapers = [];
        let currentSubjectFilter = 'all';
        
        // Modal Elements
        const modal = document.getElementById('paper-editor-modal');
        const closeBtn = document.getElementById('editor-close-btn');
        const cancelBtn = document.getElementById('editor-cancel-btn');
        const saveBtn = document.getElementById('editor-save-btn');
        
        // Form Fields
        const fId = document.getElementById('editor-paper-id');
        const fTarget = document.getElementById('editor-target-student');
        const fReqHeader = document.getElementById('editor-insight-header');
        const fReqContent = document.getElementById('editor-insight-content');

        const adminDelay = ms => new Promise(res => setTimeout(res, ms));

        const loadData = async () => {
            try {
                // --- Exoskeleton Injections ---
                studentsList.innerHTML = Array(3).fill(`
                    <div class="flex items-center justify-between p-4 rounded-xl border border-surface-container-highest/20 group">
                        <div class="flex items-center gap-4 w-full">
                            <div class="skeleton skeleton-circle w-10 h-10"></div>
                            <div class="flex flex-col gap-2 w-32">
                                <div class="skeleton skeleton-box h-4 w-full"></div>
                                <div class="skeleton skeleton-box h-2 w-2/3"></div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                papersList.innerHTML = Array(4).fill(`
                    <div class="flex items-center justify-between p-4 rounded-xl border border-surface-container-highest/20 group">
                        <div class="flex flex-col gap-2 w-48">
                            <div class="skeleton skeleton-box h-4 w-full"></div>
                            <div class="skeleton skeleton-box h-2 w-1/2"></div>
                        </div>
                    </div>
                `).join('');
                // ------------------------------

                const [sRes, pRes] = await Promise.all([
                    fetch('/api/admin/students'),
                    fetch('/api/admin/papers'),
                    adminDelay(1200)
                ]);

                if (sRes.status === 401 || sRes.status === 403) { window.location.href='/dashboard.html'; return; }
                const sData = await sRes.json();
                allStudents = sData.students || [];
                
                const pData = await pRes.json();
                allPapers = pData.papers || [];
                
                renderStudents();
                renderPapers(searchInput?.value || '', currentSubjectFilter);
                populateStudentDropdown();
            } catch (e) { console.error(e); }
        };

        const renderStudents = () => {
            if (!allStudents.length) {
                studentsList.innerHTML = '<p class="text-xs opacity-50 italic">No students found.</p>';
                return;
            }
            studentsList.innerHTML = allStudents.map(s => {
                const dateSplit = s.last_active ? new Date(s.last_active).toLocaleString() : 'Never';
                const subjects = s.subjects ? s.subjects.filter(v => v !== null) : [];
                return `
                <div class="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-container-highest/20">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            ${(s.display_name||s.email)[0].toUpperCase()}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-on-surface">${s.display_name || s.email.split('@')[0]}</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${subjects.map(sub => {
                                    const count = s.progress_by_subject ? (s.progress_by_subject[sub] || 0) : 0;
                                    return `<span class="px-2 py-1 bg-surface-container-high text-on-surface rounded flex items-center gap-2 border border-surface-container-highest/50">
                                        <span class="text-[0.6rem] font-black uppercase tracking-widest text-primary">${sub}</span>
                                        <span class="w-1 h-1 bg-outline/20 rounded-full"></span>
                                        <span class="text-[0.6rem] font-bold opacity-80">${count} Papers</span>
                                    </span>`;
                                }).join('')}
                                ${subjects.length === 0 ? '<span class="px-1.5 py-0.5 bg-error/10 text-error rounded text-[0.55rem] font-black uppercase tracking-widest">No Selection</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="showStudentSubjectsModal(${s.id}, '${s.display_name || s.email.split('@')[0]}', ${JSON.stringify(subjects).replace(/"/g, '&quot;')})" class="p-2 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant flex-shrink-0">
                        <span class="material-symbols-outlined text-sm">edit_note</span>
                    </button>
                </div>
                `;
            }).join('');
        };

        const renderPapers = (search = '', subject = 'all') => {
            let filtered = allPapers;
            
            if (subject !== 'all') {
                filtered = filtered.filter(p => p.subject === subject);
            }
            
            if (search) {
                const term = search.toLowerCase();
                filtered = filtered.filter(p => (p.title + ' ' + (p.series || '') + ' ' + (p.subject || '')).toLowerCase().includes(term));
            }

            if (!filtered.length) {
                papersList.innerHTML = '<p class="text-xs opacity-50 italic px-4 py-8 text-center">No exams found matching your criteria.</p>';
                return;
            }
            papersList.innerHTML = filtered.map(p => `
                <div class="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-container-high transition-all border border-surface-container-highest/20 cursor-pointer group" onclick="openEditor(${p.id})">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">${p.title}</span>
                        <span class="text-[0.65rem] text-on-surface-variant font-medium tracking-widest uppercase opacity-70">${p.series}</span>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
            `).join('');
        };

        let populateStudentDropdown = () => {
            const globalOptions = `
                <option value="all_Physics">Global (All Physics Students)</option>
                <option value="all_Math">Global (All Math Students)</option>
                <option value="all_Biology">Global (All Biology Students)</option>
                <option value="all_Chemistry">Global (All Chemistry Students)</option>
            `;
            let studentOptions = '';
            for (const s of allStudents) {
                 const name = s.display_name || s.email.split('@')[0];
                 const subjects = s.subjects ? s.subjects.filter(v => v !== null) : [];
                 if (subjects.length > 0) {
                     for (const sub of subjects) {
                         studentOptions += `<option value="${s.id}_${sub}">${name} (${sub})</option>`;
                     }
                 } else {
                     studentOptions += `<option value="${s.id}_Physics">${name} (Physics)</option>`;
                 }
            }
            
            fTarget.innerHTML = globalOptions + studentOptions;
            
            const es = document.getElementById('exam-target-student');
            if (es) {
                es.innerHTML = globalOptions + studentOptions;
            }
        };

        window.openEditor = (id) => {
            const p = allPapers.find(x => x.id === id);
            if (!p) return;
            fId.value = p.id;
            fReqHeader.value = p.insights_header || '';
            fReqContent.value = p.teacher_insights || '';
            fTarget.value = 'all'; // Default to global
            
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            // triggers reflow
            void modal.offsetWidth;
            modal.querySelector('div').classList.remove('scale-95', 'opacity-0');
        };

        const closeModal = () => {
            modal.querySelector('div').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = '';
            }, 300);
        };

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        
        saveBtn.onclick = async () => {
            let targetId = fTarget.value;
            let subject = 'Physics'; // Default
            
            if (targetId.includes('_')) {
                const parts = targetId.split('_');
                subject = parts[1];
                targetId = parts[0];
            }

            const payload = {
                target_student_id: targetId,
                insights_header: fReqHeader.value,
                teacher_insights: fReqContent.value,
                subject: subject
            };
            
            const btnOriginal = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Saving...';
            
            try {
                const res = await fetch(`/api/admin/papers/${fId.value}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    closeModal();
                    loadData(); // reload
                } else window.showAppModal('Error', 'Failed to save changes. Please try again later.');
            } catch (e) {
                window.showAppModal('Error', 'A network error occurred. Check your connection.');
            } finally {
                saveBtn.innerHTML = btnOriginal;
            }
        };

        // Initialize Exam Settings UI
        const examSettingsContainer = document.createElement('div');
        examSettingsContainer.className = 'col-span-full bg-surface-container-low border border-surface-container-highest/30 rounded-3xl p-8 shadow-sm';
        examSettingsContainer.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">calendar_month</span>
                    Upcoming Exam Manager
                </h3>
            </div>
            
            <div class="flex flex-col gap-8">
                <!-- Add/Edit New Exam Form -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 items-end bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-highest/20 relative">
                    <input type="hidden" id="exam-id-input">
                    <div class="space-y-2 md:col-span-1">
                        <label class="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">Assign To</label>
                        <select id="exam-target-student" class="w-full bg-surface-container border border-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary">
                            <option value="all_Physics">Global (Physics)</option>
                        </select>
                    </div>
                    <div class="space-y-2 md:col-span-1">
                        <label class="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">Exam Name</label>
                        <input id="exam-title-input" type="text" placeholder="e.g., Paper 1" class="w-full bg-surface-container border border-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary">
                    </div>
                    <div class="space-y-2 md:col-span-1">
                        <label class="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">Subtitle / Phase</label>
                        <input id="exam-subtitle-input" type="text" placeholder="e.g., Cycle 4" class="w-full bg-surface-container border border-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary">
                    </div>
                    <div class="space-y-2 md:col-span-1">
                        <label class="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
                        <input id="exam-date-input" type="date" class="w-full bg-surface-container border border-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary">
                    </div>
                    <div class="md:col-span-1 flex gap-2">
                        <button id="exam-cancel-edit-btn" class="hidden px-4 py-3 bg-surface-container-high text-on-surface rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                        <button id="exam-save-btn" class="w-full px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm" id="exam-save-icon">add</span> <span id="exam-save-text">Create Exam</span>
                        </button>
                    </div>
                </div>

                <!-- Existing Exams List -->
                <div class="space-y-4">
                    <h4 class="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">Currently Assigned Exams</h4>
                    <div id="admin-exams-list" class="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        <div class="flex items-center justify-between p-4 bg-surface-container-lowest border border-surface-container-highest/20 rounded-xl group">
                            <div class="flex flex-col gap-2 w-full">
                                <div class="skeleton skeleton-box h-4 w-48"></div>
                                <div class="skeleton skeleton-box h-3 w-32"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.max-w-6xl.mx-auto.px-6.py-12.space-y-12').appendChild(examSettingsContainer);
        
        const loadExamsList = async () => {
            try {
                const list = document.getElementById('admin-exams-list');
                list.innerHTML = `
                    <div class="flex items-center justify-between p-4 bg-surface-container-lowest border border-surface-container-highest/20 rounded-xl group">
                        <div class="flex flex-col gap-2 w-full">
                            <div class="skeleton skeleton-box h-4 w-48"></div>
                            <div class="skeleton skeleton-box h-3 w-32"></div>
                        </div>
                    </div>
                `;

                const [res] = await Promise.all([
                    fetch(`/api/admin/upcoming-exams?t=${Date.now()}`),
                    adminDelay(800)
                ]);
                const data = await res.json();
                list.innerHTML = '';
                if (data.exams && data.exams.length > 0) {
                    data.exams.forEach(ex => {
                        const dateStr = ex.exam_date ? new Date(ex.exam_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "No Date";
                        const targetText = ex.user_id ? `Assigned To: ${ex.display_name || ex.email.split('@')[0]}` : "Global (All Students)";
                        const item = document.createElement('div');
                        item.className = "flex items-center justify-between p-4 bg-surface-container-lowest border border-surface-container-highest/20 rounded-xl hover:border-surface-container-highest/50 transition-colors group";
                        item.innerHTML = `
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-on-surface">${ex.title} <span class="text-xs font-normal text-on-surface-variant ml-2 bg-surface-container px-2 py-0.5 rounded-md">${dateStr}</span></span>
                                <span class="text-xs text-on-surface-variant mt-1">${ex.subtitle}</span>
                                <span class="text-[0.6rem] font-bold uppercase tracking-widest text-${ex.user_id ? 'secondary' : 'primary'} mt-2 opacity-80">${targetText}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button data-id="${ex.id}" data-title="${ex.title.replace(/"/g, '&quot;')}" data-subtitle="${ex.subtitle.replace(/"/g, '&quot;')}" data-date="${ex.exam_date ? ex.exam_date.split('T')[0] : ''}" data-uid="${ex.user_id || 'all'}" class="btn-edit-exam w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                                    <span class="material-symbols-outlined text-[1.1rem]">edit</span>
                                </button>
                                <button data-id="${ex.id}" class="btn-del-exam w-8 h-8 rounded-lg bg-error/10 text-error hover:bg-error hover:text-on-error transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                                    <span class="material-symbols-outlined text-[1.1rem]">delete</span>
                                </button>
                            </div>
                        `;
                        list.appendChild(item);
                    });
                    
                    document.querySelectorAll('.btn-edit-exam').forEach(btn => {
                        btn.onclick = (e) => {
                            const dom = e.currentTarget;
                            document.getElementById('exam-id-input').value = dom.getAttribute('data-id');
                            document.getElementById('exam-title-input').value = dom.getAttribute('data-title');
                            document.getElementById('exam-subtitle-input').value = dom.getAttribute('data-subtitle');
                            document.getElementById('exam-date-input').value = dom.getAttribute('data-date');
                            document.getElementById('exam-target-student').value = dom.getAttribute('data-uid');
                            
                            document.getElementById('exam-save-icon').textContent = 'save';
                            document.getElementById('exam-save-text').textContent = 'Update';
                            document.getElementById('exam-cancel-edit-btn').classList.remove('hidden');
                        };
                    });
                    
                    document.querySelectorAll('.btn-del-exam').forEach(btn => {
                        btn.onclick = (e) => {
                            const btnEl = e.currentTarget;
                            const id = btnEl.getAttribute('data-id');
                            window.showAppModal('Remove Exam', 'Are you sure you want to delete this assigned exam?', true, async () => {
                                btnEl.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span>';
                                await fetch(`/api/admin/upcoming-exams/${id}`, { method: 'DELETE' });
                                await loadExamsList();
                            });
                        };
                    });
                } else {
                    list.innerHTML = '<p class="text-sm opacity-50 italic">No exams currently assigned.</p>';
                }
            } catch(e) {}
        };

        const cancelEditBtn = document.getElementById('exam-cancel-edit-btn');
        cancelEditBtn.onclick = () => {
            document.getElementById('exam-id-input').value = '';
            document.getElementById('exam-title-input').value = '';
            document.getElementById('exam-subtitle-input').value = '';
            document.getElementById('exam-date-input').value = '';
            document.getElementById('exam-target-student').value = 'all';
            document.getElementById('exam-save-icon').textContent = 'add';
            document.getElementById('exam-save-text').textContent = 'Create Exam';
            cancelEditBtn.classList.add('hidden');
        };

        document.getElementById('exam-save-btn').onclick = async () => {
            const btn = document.getElementById('exam-save-btn');
            const idInput = document.getElementById('exam-id-input');
            const titleInput = document.getElementById('exam-title-input');
            const subInput = document.getElementById('exam-subtitle-input');
            const dateInput = document.getElementById('exam-date-input');
            const targetInput = document.getElementById('exam-target-student');
            
            if(!titleInput.value) {
                window.showAppModal('Missing Data', 'Exam name is required to create a new exam.');
                return;
            }

                btn.innerHTML = 'Saving...';
            
            try {
                const method = idInput.value ? 'PUT' : 'POST';
                const url = idInput.value ? `/api/admin/upcoming-exams/${idInput.value}` : '/api/admin/upcoming-exams';
                
                const targetVal = targetInput.value;
                let subjectVal = 'Physics';
                let targetId = 'all';

                if (targetVal.includes('_')) {
                    const parts = targetVal.split('_');
                    subjectVal = parts[1];
                    targetId = parts[0];
                }

                await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: titleInput.value,
                        subtitle: subInput.value,
                        exam_date: dateInput.value || null,
                        target_student_id: targetId,
                        subject: subjectVal
                    })
                });
                
                await loadExamsList();
                cancelEditBtn.onclick(); // reset form to create mode natively
                
                btn.innerHTML = `<span class="material-symbols-outlined text-sm">check</span> Saved!`;
                setTimeout(() => {
                    btn.innerHTML = `<span class="material-symbols-outlined text-sm" id="exam-save-icon">add</span> <span id="exam-save-text">Create Exam</span>`;
                }, 2000);

            } catch (e) {
                // Ignore
            }
        };

        // Function is now part of the main block and handles both menus
        populateStudentDropdown();

        searchInput.addEventListener('input', (e) => renderPapers(e.target.value, currentSubjectFilter));
        
        subjectFilterSelect?.addEventListener('change', (e) => {
            currentSubjectFilter = e.target.value;
            renderPapers(searchInput.value, currentSubjectFilter);
        });

        loadData();
        loadExamsList();

        document.getElementById('student-subjects-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('manage-student-id').value;
            const subjects = Array.from(new FormData(e.target).getAll('subjects'));
            
            try {
                const res = await fetch(`/api/admin/students/${id}/subjects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subjects })
                });
                if (res.ok) {
                    window.showAppModal('Success', 'Enrollments updated successfully.');
                    document.getElementById('student-subjects-modal').classList.add('hidden');
                    loadData();
                }
            } catch (err) { console.error(err); }
        });
    }
});
window.showSubjectSelectionModal = function(subjects) {
    let modal = document.getElementById('subject-selection-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'subject-selection-modal';
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-surface-container-lowest/80 backdrop-blur-3xl transition-all duration-700';
        document.body.appendChild(modal);
    }
    
    const subjectIcons = {
        'Physics': 'bolt',
        'Math': 'calculate',
        'Biology': 'genetics',
        'Chemistry': 'science'
    };

    const subjectColors = {
        'Physics': 'from-[#455f88]/20 to-[#455f88]/5',
        'Math': 'from-[#8a2525]/20 to-[#8a2525]/5',
        'Biology': 'from-[#165a3c]/20 to-[#165a3c]/5',
        'Chemistry': 'from-[#543884]/20 to-[#543884]/5'
    };

    modal.innerHTML = `
        <div class="max-w-4xl w-full text-center animate-in fade-in zoom-in duration-700">
            <h1 class="text-4xl lg:text-6xl font-black tracking-tighter text-on-surface mb-2">Welcome Back.</h1>
            <p class="text-on-surface-variant font-bold uppercase tracking-[0.3em] text-[0.7rem] mb-12 opacity-60">Select your active session</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${subjects.map(sub => `
                    <div onclick="selectActiveSubject('${sub}')" class="group relative bg-surface-container-low border border-surface-container-highest/30 rounded-[2.5rem] p-8 cursor-pointer hover:scale-[1.05] hover:shadow-2xl transition-all duration-500">
                        <div class="absolute inset-0 bg-gradient-to-br ${subjectColors[sub] || 'from-primary/10 to-primary/5'} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]"></div>
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6 border border-surface-container-highest/20 group-hover:bg-primary/10 transition-colors">
                                <span class="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-colors">${subjectIcons[sub] || 'school'}</span>
                            </div>
                            <h3 class="text-xl font-black text-on-surface mb-1">${sub}</h3>
                            <p class="text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">Active Portal</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.style.overflow = 'hidden';
};

window.selectActiveSubject = async function(subject) {
    try {
        const res = await fetch('/api/select-subject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject })
        });
        if (res.ok) {
            window.location.href = 'dashboard.html';
        }
    } catch (err) { console.error(err); }
};

// Admin Student Subject Enrollment Functions
window.showStudentSubjectsModal = function(id, name, subjects) {
    const modal = document.getElementById('student-subjects-modal');
    document.getElementById('manage-student-id').value = id;
    document.getElementById('student-name-modal').textContent = name;
    
    // Check checkboxes
    const checkboxes = document.querySelectorAll('#student-subjects-form input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = subjects.includes(cb.value);
    });
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

window.closeStudentSubjectsModal = function() {
    const modal = document.getElementById('student-subjects-modal');
    modal.classList.add('hidden');
    modal.style.display = '';
};
