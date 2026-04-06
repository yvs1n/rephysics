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
                "primary-dim": "#39537c",
                "primary-container": "#d6e3ff",
                "surface-tint": "#455f88",
                "surface-dim": "#d1dce0",
                "on-primary-container": "#38527b",
                "primary": "#455f88",
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
                "on-primary": "#f6f7ff"
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
    if (!duration || duration === 0) return 0;
    return Math.min(100, Math.floor((watched / duration) * 100));
};

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname.toLowerCase();

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
    const headerLeft = document.querySelector('header div.flex.items-center.gap-4');
    
    if (headerLeft) {
        const hamburger = document.createElement('button');
        hamburger.id = 'mobile-menu-toggle';
        hamburger.className = 'lg:hidden flex items-center justify-center w-10 h-10 -ml-2 mr-2 text-on-surface hover:bg-surface-container-high rounded-full transition-colors';
        hamburger.innerHTML = '<span class="material-symbols-outlined text-3xl">menu</span>';
        headerLeft.prepend(hamburger);
    }

    // Mobile Nav Overlay
    const mobileOverlay = document.createElement('div');
    mobileOverlay.id = 'mobile-nav-overlay';
    mobileOverlay.className = 'fixed inset-0 bg-surface-container-lowest z-[100] flex flex-col p-8 transition-all duration-500 translate-x-full opacity-0 invisible';
    mobileOverlay.innerHTML = `
        <div class="flex justify-between items-center mb-12">
            <h2 class="text-2xl font-light tracking-[0.2em] uppercase text-on-surface">Atelier</h2>
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

        const profileBtn = document.createElement('div');
        profileBtn.className = "flex items-center gap-3 lg:gap-4 cursor-pointer group p-1 lg:p-2 rounded-full hover:bg-primary/5 transition-all relative";
        profileBtn.innerHTML = `
            <div class="w-10 lg:w-12 h-10 lg:h-12 rounded-full overflow-hidden border-2 border-surface-container-highest shadow-sm group-hover:border-primary/30 transition-all">
                <img src="https://ui-avatars.com/api/?name=Student&background=455f88&color=fff" class="w-full h-full object-cover"/>
            </div>
            <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Student</span>
                <span class="text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Student</span>
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
    }

    // -----------------------------------------
    // PAGE SPECIFIC RENDERS
    // -----------------------------------------
    
    // DASHBOARD
    const dashHero = document.getElementById('hero-latest');
    if (dashHero) {
        const res = await fetch('/api/dashboard');
        if (res.status === 401) { window.location.href = '/index.html'; return; }
        const data = await res.json();

        // 1. Account Greeting & Subtitle Styling
        const greetingHeader = document.getElementById('user-greeting');
        if (greetingHeader && data.user) {
            const name = data.user.display_name || data.user.email.split('@')[0];
            greetingHeader.innerHTML = `Hi, <span class="text-primary">${name}</span>!`;
        }
        
        // 2. Cloud Sync Badge
        const historyTitle = document.querySelector('main h2.text-2xl');
        if (historyTitle && !historyTitle.querySelector('.sync-badge')) {
            const badge = document.createElement('span');
            badge.className = 'sync-badge inline-flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[0.6rem] font-bold uppercase tracking-widest opacity-80';
            badge.innerHTML = `<span class="material-symbols-outlined text-[0.8rem]" style="font-variation-settings: 'FILL' 1;">cloud_done</span> Account Synced`;
            historyTitle.appendChild(badge);
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

        // 4. History Grid Render
        const grid = document.getElementById('history-grid');
        if (grid) {
            if (data.history && data.history.length > 0) {
                grid.innerHTML = '';
                data.history.forEach(item => {
                    let p = formatProgress(item.watched_seconds, item.duration_seconds);
                    grid.innerHTML += `
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
        const renderGrid = async (sortValue = 'date_desc') => {
            const res = await fetch(`/api/papers?sort=${sortValue}`);
            const data = await res.json();
            
            // Clean up loading indicators
            const upcomingSection = document.querySelector('h2.text-2xl')?.parentElement?.nextElementSibling;
            
            if (lessonsGrid && data.papers) {
                lessonsGrid.innerHTML = '';
                data.papers.forEach(paper => {
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
            }
        };
        const sortFilter = document.getElementById('sort-filter');
        sortFilter && sortFilter.addEventListener('change', (e) => renderGrid(e.target.value));
        renderGrid();
    }

    // PAST PAPERS LIST
    const papersContainer = document.getElementById('papers-list');
    if (papersContainer) {
        const renderPapersList = async (sort = 'date_desc') => {
            const res = await fetch(`/api/papers?sort=${sort}`);
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
                                    <button class="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-primary hover:text-white transition-all text-xs font-bold"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-lg">description</span> Question Paper</div> <span class="material-symbols-outlined text-lg">download</span></button>
                                    <button class="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-primary hover:text-white transition-all text-xs font-bold"><div class="flex items-center gap-3"><span class="material-symbols-outlined text-lg">check_circle</span> Marking Scheme</div> <span class="material-symbols-outlined text-lg">download</span></button>
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
        const res = await fetch('/api/papers');
        const data = await res.json();
        const paper = data.papers.find(x => x.id === paperId);
        
        if (paper) {
            const timeDisplay = document.getElementById('time-duration');
            const titleEle = document.getElementById('lesson-title');
            const seriesEle = document.getElementById('top-subtitle');

            if (titleEle) titleEle.textContent = paper.title;
            if (seriesEle) seriesEle.textContent = paper.series;

            video.addEventListener('loadedmetadata', () => {
                if (video.duration) {
                    if (timeDisplay) timeDisplay.textContent = formatMins(video.duration);
                    if (paper.watched_seconds > 0 && paper.watched_seconds < video.duration) video.currentTime = paper.watched_seconds;
                }
            }, { once: true });
            video.src = paper.video_url;
            video.load();

            // Auto-save logic
            let lastSaved = 0;
            video.addEventListener('timeupdate', () => {
                const now = Math.floor(video.currentTime);
                if (now > 0 && now !== lastSaved && now % 5 === 0) {
                    lastSaved = now;
                    fetch('/api/progress', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ paperId, watchedSeconds: now }) }).catch(()=>null);
                }
            });
        }
    }
});
