/**
 * Butterscotch Web - Main Application Script
 * Enhanced UI, Animations, Search, Filtering, Lightbox & Functionality
 */

let currentCategory = 'ROM';
let currentDeviceFilter = 'All';
let currentSearchQuery = '';
let currentSortOrder = 'newest';
let activeDownloadUrl = '';
let isSecretMode = false;
let spamCount = 0;
let spamTimeout;
let isEggTriggered = false;
let lastOpenedRomId = null;
let spamTarget = Math.floor(Math.random() * 11) + 5;

// Lightbox state
let currentLightboxImages = [];
let currentLightboxIndex = 0;

// Preload audio and easter egg gif
function preloadAssets() {
    try {
        const img = new Image();
        img.src = 'assets/tree.gif';
        const audio = new Audio();
        audio.src = 'assets/man.ogg';
        audio.preload = 'auto';
    } catch (e) {}
}

// Convert GMT+8 target date safely
function getGMT8Target(dateStr) {
    if (!dateStr) return new Date();
    const parts = String(dateStr).trim().replace(/\//g, '-').split('-');
    if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return new Date(`${y}-${m}-${d}T20:00:00+08:00`);
    }
    return new Date(dateStr);
}

// Dynamic Theme CSS loader (smooth stylesheet switching without breaking)
function updateCSS(suffix) {
    const desiredSuffix = suffix || '-gold';
    const newHref = 'assets/css/style' + desiredSuffix + '.css';
    const currentLink = document.getElementById('main-css') || document.querySelector('link[href*="style"]');

    if (currentLink && currentLink.getAttribute('href') && currentLink.getAttribute('href').includes(newHref)) {
        return;
    }

    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = newHref + '?v=' + Date.now();

    newLink.onload = () => {
        if (currentLink && currentLink !== newLink) {
            currentLink.remove();
        }
        newLink.id = 'main-css';
    };

    document.head.appendChild(newLink);
}

// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning' || type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-text">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Easter Egg
function triggerEasterEgg() {
    if (isEggTriggered) return;
    isEggTriggered = true;

    document.body.innerHTML = '';
    document.body.style.backgroundColor = '#000000';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.height = '100vh';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';

    const img = document.createElement('img');
    img.src = 'assets/tree.gif';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100vh';
    img.style.objectFit = 'contain';
    img.style.position = 'relative';
    img.style.zIndex = '1';
    document.body.appendChild(img);

    try {
        const audio = new Audio('assets/man.ogg');
        audio.loop = true;
        audio.play().catch(e => {});
    } catch (e) {}
}

// Skeleton Placeholder Shimmer during filter changes
function showPlaceholders() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    let skeletonCards = "";
    for (let i = 0; i < 4; i++) {
        skeletonCards += `
        <div class="rom-card" style="padding: 0; pointer-events: none;">
            <div class="skeleton-shimmer" style="width: 100%; height: 175px; background: var(--surface-cards);"></div>
            <div style="padding: 22px; display: flex; flex-direction: column; flex-grow: 1;">
                <div class="skeleton-shimmer" style="width: 70%; height: 26px; background: var(--surface); border-radius: 8px; margin-bottom: 14px;"></div>
                <div class="skeleton-shimmer" style="width: 45%; height: 14px; background: var(--surface); border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-shimmer" style="width: 55%; height: 14px; background: var(--surface); border-radius: 4px; margin-bottom: 20px;"></div>
                <div class="skeleton-shimmer" style="width: 100%; height: 44px; background: var(--surface); border-radius: 100px; margin-top: auto;"></div>
            </div>
        </div>
        `;
    }

    container.innerHTML = skeletonCards;
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    preloadAssets();

    // Aggregate ROM datasets
    window.romData = [];
    if (window.kunziteData) window.romData = window.romData.concat(window.kunziteData);
    if (window.fogData) window.romData = window.romData.concat(window.fogData);
    if (window.earthData) window.romData = window.romData.concat(window.earthData);
    if (window.galeData) window.romData = window.romData.concat(window.galeData);

    window.romData.forEach(item => {
        if (!item.category) item.category = 'ROM';
    });

    // Update dynamic statistics in Hero section
    updateHeroStats();

    // Auto-fill footer year
    const currentYearStr = new Date().getFullYear();
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = currentYearStr;

    // Theme Management (Light / Dark)
    initThemeManager();

    // Leaf Particles
    createLeaves();

    // Setup Filter Hub & Search
    initSearchAndFilters();

    // Initial Renders
    renderCategoryFilters();
    renderDeviceFilterChips();
    renderROMCards();

    // Announcement & Router
    loadAnnouncement();
    handleRouting();

    // Keyboard Shortcuts
    initKeyboardShortcuts();
});

// Update Hero Statistics
function updateHeroStats() {
    if (!window.romData) return;
    const totalRomsEl = document.getElementById('stat-total-roms');
    const totalDevicesEl = document.getElementById('stat-total-devices');

    if (totalRomsEl) {
        totalRomsEl.textContent = window.romData.length;
    }
    if (totalDevicesEl) {
        const uniqueDevices = new Set(window.romData.map(r => r.device));
        totalDevicesEl.textContent = uniqueDevices.size;
    }
}

// Theme Management System
function initThemeManager() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const metaThemeColor = document.getElementById('meta-theme-color');

    function applyTheme(theme, save = true) {
        html.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('butterscotch-theme', theme);
        }

        if (theme === 'light') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
            if (metaThemeColor) metaThemeColor.setAttribute('content', '#fdfbf7');
        } else {
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
            if (metaThemeColor) metaThemeColor.setAttribute('content', '#14120e');
        }
    }

    const savedTheme = localStorage.getItem('butterscotch-theme');
    if (savedTheme) {
        applyTheme(savedTheme, false);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light', false);
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme, true);
            showToast(`Theme switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 2000);
        });
    }

    // Follow system if no explicit user override stored
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('butterscotch-theme')) {
            applyTheme(e.matches ? 'dark' : 'light', false);
        }
    });
}

// Search and Filter Hub
function initSearchAndFilters() {
    const searchInput = document.getElementById('rom-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const sortSelect = document.getElementById('rom-sort-select');

    let debounceTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim().toLowerCase();
            if (clearBtn) {
                if (currentSearchQuery.length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }

            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                renderROMCards();
            }, 120);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentSearchQuery = '';
            clearBtn.classList.add('hidden');
            renderROMCards();
            if (searchInput) searchInput.focus();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortOrder = e.target.value;
            renderROMCards();
        });
    }
}

// Keyboard shortcuts: / to search, Esc to close/clear
function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInputActive = activeTag === 'input' || activeTag === 'textarea';

        if (e.key === '/' && !isInputActive) {
            e.preventDefault();
            const searchInput = document.getElementById('rom-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        } else if (e.key === 'Escape') {
            // Check lightbox first
            const lightbox = document.getElementById('lightbox-modal');
            if (lightbox && lightbox.style.display !== 'none') {
                closeLightbox();
                return;
            }

            // Check modals
            closeModal();
            closeReaderModal();

            // Clear search if focused
            const searchInput = document.getElementById('rom-search-input');
            if (isInputActive && searchInput) {
                searchInput.value = '';
                currentSearchQuery = '';
                const clearBtn = document.getElementById('search-clear-btn');
                if (clearBtn) clearBtn.classList.add('hidden');
                renderROMCards();
                searchInput.blur();
            }
        } else if (e.key === 'ArrowLeft') {
            const lightbox = document.getElementById('lightbox-modal');
            if (lightbox && lightbox.style.display !== 'none') {
                prevLightboxImage();
            }
        } else if (e.key === 'ArrowRight') {
            const lightbox = document.getElementById('lightbox-modal');
            if (lightbox && lightbox.style.display !== 'none') {
                nextLightboxImage();
            }
        }
    });
}

// Render Device Filter Chips
function renderDeviceFilterChips() {
    const container = document.getElementById('device-filter-chips');
    if (!container || !window.romData) return;

    let visibleData = window.romData;
    if (isSecretMode) {
        visibleData = visibleData.filter(rom => rom.isPersonal);
    } else {
        visibleData = visibleData.filter(rom => !rom.isPersonal);
    }

    // Extract device codenames / names
    const deviceMap = new Map();
    visibleData.forEach(rom => {
        const deviceName = rom.device || 'Other';
        const match = deviceName.match(/\(([^)]+)\)/);
        const codename = match ? match[1] : deviceName;
        const count = (deviceMap.get(codename) || 0) + 1;
        deviceMap.set(codename, count);
    });

    let chipsHtml = `
        <button class="chip-btn ${currentDeviceFilter === 'All' ? 'active' : ''}" onclick="setDeviceFilter('All')">
            <span>All Devices</span>
            <span class="chip-count">${visibleData.length}</span>
        </button>
    `;

    deviceMap.forEach((count, codename) => {
        const isActive = currentDeviceFilter === codename;
        chipsHtml += `
            <button class="chip-btn ${isActive ? 'active' : ''}" onclick="setDeviceFilter('${codename}')">
                <span>${codename}</span>
                <span class="chip-count">${count}</span>
            </button>
        `;
    });

    container.innerHTML = chipsHtml;
}

function setDeviceFilter(deviceCodename) {
    if (currentDeviceFilter === deviceCodename) return;
    currentDeviceFilter = deviceCodename;
    renderDeviceFilterChips();
    showPlaceholders();
    setTimeout(() => {
        renderROMCards();
    }, 150);
}

// Render Category Filter Tabs
function renderCategoryFilters() {
    const filterContainer = document.getElementById('home-device-filter-container');
    if (!filterContainer || !window.romData) return;

    let visibleData = window.romData;
    if (isSecretMode) {
        visibleData = visibleData.filter(rom => rom.isPersonal);
    } else {
        visibleData = visibleData.filter(rom => !rom.isPersonal);
    }

    const categories = [...new Set(visibleData.map(rom => rom.category || 'ROM'))];
    if (!categories.includes(currentCategory) && categories.length > 0) {
        currentCategory = categories[0];
    }

    let catHtml = `
        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; -ms-overflow-style: none;">
    `;

    categories.forEach(cat => {
        catHtml += `<button class="filter-btn ${currentCategory === cat ? 'active' : ''}" onclick="setCategory('${cat}')" style="white-space: nowrap; flex-shrink: 0; padding: 8px 18px; font-size: 0.9rem; border-radius: 100px;">${cat}</button>`;
    });

    catHtml += `</div>`;
    filterContainer.innerHTML = catHtml;
}

function setCategory(cat) {
    if (currentCategory === cat) return;
    currentCategory = cat;
    renderCategoryFilters();
    showPlaceholders();
    setTimeout(() => {
        renderROMCards();
    }, 150);
}

// Main Cards Renderer with Search, Filters, and Sorting
function renderROMCards() {
    const container = document.getElementById('cards-container');
    const counterEl = document.getElementById('results-counter');
    if (!container) return;

    if (!window.romData || !Array.isArray(window.romData)) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 30px; background: rgba(255, 107, 107, 0.1); border: 2px dashed #ff6b6b; border-radius: 20px; text-align: center;">
                <h3 style="color: #ff6b6b; font-family: 'Syne', sans-serif; margin-bottom: 10px;">⚠️ Failed to load ROM data</h3>
                <p style="color: var(--text);">Make sure your device datasets are loaded correctly.</p>
            </div>
        `;
        return;
    }

    let filteredData = [...window.romData];

    // Personal / Secret Mode filter
    if (isSecretMode) {
        filteredData = filteredData.filter(rom => rom.isPersonal);
    } else {
        filteredData = filteredData.filter(rom => !rom.isPersonal);
    }

    // Category filter
    filteredData = filteredData.filter(rom => (rom.category || 'ROM') === currentCategory);

    // Device filter
    if (currentDeviceFilter !== 'All') {
        filteredData = filteredData.filter(rom => {
            const dev = rom.device || '';
            return dev.toLowerCase().includes(currentDeviceFilter.toLowerCase());
        });
    }

    // Search query filter
    if (currentSearchQuery) {
        filteredData = filteredData.filter(rom => {
            const name = (rom.name || '').toLowerCase();
            const dev = (rom.device || '').toLowerCase();
            const ver = (rom.version || '').toLowerCase();
            const desc = (rom.description || '').toLowerCase();
            const notes = (rom.notes || '').toLowerCase();
            return name.includes(currentSearchQuery) ||
                   dev.includes(currentSearchQuery) ||
                   ver.includes(currentSearchQuery) ||
                   desc.includes(currentSearchQuery) ||
                   notes.includes(currentSearchQuery);
        });
    }

    // Sorting
    filteredData.sort((a, b) => {
        if (currentSortOrder === 'newest') {
            const dateA = a.buildDate ? getGMT8Target(a.buildDate).getTime() : 0;
            const dateB = b.buildDate ? getGMT8Target(b.buildDate).getTime() : 0;
            return dateB - dateA;
        } else if (currentSortOrder === 'oldest') {
            const dateA = a.buildDate ? getGMT8Target(a.buildDate).getTime() : 0;
            const dateB = b.buildDate ? getGMT8Target(b.buildDate).getTime() : 0;
            return dateA - dateB;
        } else if (currentSortOrder === 'name') {
            return (a.name || '').localeCompare(b.name || '');
        } else if (currentSortOrder === 'android') {
            const getVerNum = str => {
                const match = String(str).match(/Android\s*(\d+)/i);
                return match ? parseInt(match[1], 10) : 0;
            };
            return getVerNum(b.version) - getVerNum(a.version);
        }
        return 0;
    });

    // Update results counter
    if (counterEl) {
        counterEl.textContent = `Showing ${filteredData.length} ROM${filteredData.length === 1 ? '' : 's'}`;
    }

    // Empty state
    if (filteredData.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px auto; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; color: var(--muted);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <h3 style="font-family: 'Syne', sans-serif; font-size: 1.4rem; color: var(--text); margin-bottom: 8px;">No matching ROMs found</h3>
                <p style="color: var(--muted); font-size: 0.95rem; max-width: 420px; margin: 0 auto 20px auto;">
                    ${currentSearchQuery ? `We couldn't find any builds matching "${currentSearchQuery}".` : 'No items match the selected device or category filters.'}
                </p>
                <button class="btn-dl secondary" onclick="resetSearchAndFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    // Grouping by device
    const devicesToRender = [...new Set(filteredData.map(rom => rom.device))];
    let htmlContent = "";

    devicesToRender.forEach((device, index) => {
        const marginTop = index === 0 ? "0px" : "40px";
        const deviceRoms = filteredData.filter(rom => rom.device === device);

        htmlContent += `
            <div style="grid-column: 1 / -1; margin-top: ${marginTop}; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="font-family: 'Syne', sans-serif; font-size: 1.4rem; color: var(--accent); display: flex; align-items: center; gap: 10px; margin: 0;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    <span>${device}</span>
                </h2>
                <span style="font-size: 0.85rem; color: var(--muted); font-weight: 600;">${deviceRoms.length} build${deviceRoms.length === 1 ? '' : 's'}</span>
            </div>
        `;

        htmlContent += deviceRoms.map((rom, romIdx) => {
            let badgeHtml = "";
            const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
            const now = new Date();
            const isUpcoming = build && build > now;
            const isNuked = !isUpcoming && (!rom.downloadUrl || rom.downloadUrl.trim() === "");

            let cardAction = `onclick="viewDetail('${rom.id}')"`;
            let cursorStyle = "cursor: pointer;";
            let btnText = 'View Details';
            let btnClass = "btn-dl primary btn-card-main";
            let btnStyle = "";

            // Extract codename from device
            const matchCodename = (rom.device || '').match(/\(([^)]+)\)/);
            const codename = matchCodename ? matchCodename[1] : '';

            // Extract Android version pill
            const matchAndroid = (rom.version || '').match(/(Android\s*\d+)/i);
            const androidPill = matchAndroid ? matchAndroid[1] : 'Android';

            if (isNuked) {
                badgeHtml += `<span class="badge-tag nuked">NUKED</span>`;
                cardAction = `onclick="showNukedPopup()"`;
                cursorStyle = "cursor: pointer;";
                btnText = "Unavailable";
                btnStyle = "opacity: 0.6;";
                btnClass = "btn-dl secondary btn-card-main";
                displayDate = "Unavailable";
            } else if (isUpcoming) {
                badgeHtml += `<span class="badge-tag upcoming">UPCOMING</span>`;
                displayDate = "Coming soon";
            } else if (build) {
                displayDate = build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const diffTime = now - build;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 21) {
                    badgeHtml += `<span class="badge-tag new">NEW</span>`;
                }
            }

            if (rom.isPersonal) {
                badgeHtml += `<span class="badge-tag personal">PERSONAL</span>`;
            }

            let bannerContent = isNuked
                ? `<div class="nuked-banner-noise" style="width: 100%; height: 100%;"></div>`
                : `<div class="card-banner-img" style="background-image: url('${rom.banner}');"></div>`;

            return `
            <div class="rom-card" ${cardAction} style="${cursorStyle} animation-delay: ${romIdx * 0.05}s;">
                <div class="card-banner-wrapper">
                    ${bannerContent}
                    <div class="card-banner-overlay">
                        <div class="card-floating-badges">
                            <span class="card-device-badge">${codename || 'Xiaomi'}</span>
                            <span class="card-version-pill">${androidPill}</span>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <div class="card-title-row">
                        <h3 class="card-title" style="color: ${isNuked ? 'var(--muted)' : 'var(--accent)'};">
                            ${rom.name}
                        </h3>
                        <div style="display: flex; gap: 4px;">
                            ${badgeHtml}
                        </div>
                    </div>

                    <div class="card-info-list">
                        <div class="card-info-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                            <span>Device: <span class="val">${rom.device}</span></span>
                        </div>
                        <div class="card-info-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span>Version: <span class="val">${rom.version}</span></span>
                        </div>
                        <div class="card-info-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Released: <span class="val">${displayDate}</span></span>
                        </div>
                    </div>

                    <div class="card-actions-row">
                        <button class="${btnClass}" style="${btnStyle}">${btnText}</button>
                        <button class="btn-card-share" onclick="event.stopPropagation(); copyRomLink('${rom.id}')" title="Copy ROM link" aria-label="Copy link">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    });

    container.innerHTML = htmlContent;
}

// Reset filters helper
function resetSearchAndFilters() {
    currentSearchQuery = '';
    currentDeviceFilter = 'All';
    const searchInput = document.getElementById('rom-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    renderDeviceFilterChips();
    renderROMCards();
}

// Copy ROM Direct Link
function copyRomLink(romId) {
    const url = window.location.origin + window.location.pathname + '#' + romId;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

function shareCurrentRom() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        copyRomLink(hash);
    } else {
        copyRomLink('');
    }
}

// Home Navigation
function navigateHome(fromHash = false) {
    updateCSS('-gold');

    if (!fromHash) {
        if (isSecretMode) {
            window.location.hash = 'personal';
            return;
        }
        if (window.location.hash) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    }

    const detailPage = document.getElementById('page-detail');
    const homePage = document.getElementById('page-home');

    if (detailPage) detailPage.classList.remove('active');
    if (homePage) homePage.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderCategoryFilters();
    renderDeviceFilterChips();
    renderROMCards();
}

// 404 Error Page
function show404() {
    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) detailContainer.style.background = 'transparent';

    const topBar = document.querySelector('.detail-top-bar');
    if (topBar) topBar.style.display = 'none';

    document.getElementById('detail-content').innerHTML = `
        <div style="text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="font-family: 'Syne', sans-serif; font-size: 7rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 10px;">404</h1>
            <h2 style="font-family: 'Syne', sans-serif; font-size: 2rem; color: var(--text); margin-bottom: 14px;">Build Not Found</h2>
            <p style="color: var(--muted); font-size: 1.05rem; max-width: 500px; margin-bottom: 35px; line-height: 1.6;">
                The ROM you are searching for does not exist or has been relocated.
            </p>
            <button class="btn-dl primary" onclick="navigateHome()" style="padding: 14px 32px; font-size: 1rem;">
                Back to All ROMs
            </button>
        </div>
    `;

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
}

// Popup Alerts
function showUpcomingPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 16px auto; border-radius: 50%; background: var(--accent-subtle); color: var(--accent); display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h2 style="font-family: 'Syne', sans-serif; font-size: 1.8rem; color: var(--accent); margin-bottom: 12px;">Stay Tuned!</h2>
            <p style="color: var(--text); font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                This build is actively in development. Direct downloads will be posted as soon as testing completes.
            </p>
            <button class="btn-dl primary" onclick="closeModal()">Got it</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function showNukedPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 16px auto; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </div>
            <h2 style="font-family: 'Syne', sans-serif; font-size: 1.8rem; color: #ef4444; margin-bottom: 12px;">Build Withdrawn</h2>
            <p style="color: var(--text); font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                This ROM build has been deprecated or nuked due to newer releases or issues. Details and files are no longer accessible.
            </p>
            <button class="btn-dl primary" onclick="closeModal()">Understood</button>
        </div>
    `;
    modal.style.display = 'flex';
}

function showDownloadWarningPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 16px auto; border-radius: 50%; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 style="font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #ef4444; margin-bottom: 14px;">
                Important Flashing Notice
            </h2>

            <div style="font-size: 0.92rem; line-height: 1.6; margin-bottom: 24px; background: var(--surface); padding: 16px 18px; border-radius: var(--radius-md); border: 1px solid var(--border); text-align: left;">
                <strong style="color: #ef4444; font-size: 1rem; display: block; margin-bottom: 6px;">
                    Your warranty is now void.
                </strong>
                <p style="margin: 0; color: var(--muted);">
                    We are not responsible for bricked devices, dead SD cards, or thermonuclear war. Please verify instructions carefully before flashing! You choose to install this at your own discretion.
                </p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-dl secondary" onclick="closeModal()">Cancel</button>
                <button class="btn-dl secondary" onclick="copyActiveDownloadUrl()">Copy Link</button>
                <button class="btn-dl primary" onclick="proceedDownload()">Proceed to Download</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function copyActiveDownloadUrl() {
    if (activeDownloadUrl) {
        navigator.clipboard.writeText(activeDownloadUrl).then(() => {
            showToast('Download link copied!', 'success');
        });
    }
}

function proceedDownload() {
    closeModal();
    if (activeDownloadUrl) {
        window.open(activeDownloadUrl, '_blank');
        showToast('Opening download mirror...', 'info');
    }
}

// Markdown Parser with Telegram handle and command block support
function parseMarkdown(text) {
    if (!text) return "";
    let safeText = String(text).replace(/^[ \t]+/gm, '');
    safeText = safeText.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1<a href="https://t.me/$2" target="_blank" rel="noopener noreferrer" class="rom-link">@$2</a>');

    try {
        if (window.marked && window.marked.parse) {
            return window.marked.parse(safeText);
        } else if (typeof window.marked === 'function') {
            return window.marked(safeText);
        } else {
            return safeText.replace(/\n/g, '<br>');
        }
    } catch (e) {
        return safeText.replace(/\n/g, '<br>');
    }
}

// Enhance markdown blocks with 1-click copy buttons
function enhanceMarkdownBlocks(container) {
    if (!container) return;

    // Attach copy buttons to all code blocks
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
        if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.type = 'button';
        copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
        `;

        copyBtn.addEventListener('click', () => {
            const textToCopy = pre.innerText.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.classList.add('copied');
                copyBtn.querySelector('span').textContent = 'Copied!';
                showToast('Code copied to clipboard!', 'success');
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.querySelector('span').textContent = 'Copy';
                }, 2000);
            }).catch(() => {
                showToast('Failed to copy', 'error');
            });
        });

        wrapper.appendChild(copyBtn);
    });

    // Make external links open safely in new tab
    const links = container.querySelectorAll('a');
    links.forEach(a => {
        if (!a.getAttribute('target')) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Tab Switching
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const btn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    const content = document.getElementById(`tab-${tabId}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
};

// View ROM Detail
function viewDetail(id) {
    if (isEggTriggered) return;

    // Easter Egg Click Spammer logic
    if (id === lastOpenedRomId) {
        spamCount++;
    } else {
        spamCount = 1;
        lastOpenedRomId = id;
        spamTarget = Math.floor(Math.random() * 11) + 5;
    }

    clearTimeout(spamTimeout);
    spamTimeout = setTimeout(() => {
        spamCount = 0;
        lastOpenedRomId = null;
        spamTarget = Math.floor(Math.random() * 11) + 5;
    }, 2500);

    if (spamCount >= spamTarget) {
        triggerEasterEgg();
        return;
    }

    const rom = window.romData.find(r => String(r.id) === String(id));
    if (!rom) {
        show404();
        return;
    }

    // Apply theme suffix if defined (e.g. sakura, gold)
    updateCSS(rom.cssSuffix || '-gold');

    const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
    const now = new Date();
    const isUpcoming = build && build > now;
    const isNuked = !isUpcoming && (!rom.downloadUrl || rom.downloadUrl.trim() === "");

    if (isNuked) {
        showNukedPopup();
        window.location.hash = isSecretMode ? 'personal' : '';
        return;
    }

    const topBar = document.querySelector('.detail-top-bar');
    if (topBar) topBar.style.display = 'flex';

    activeDownloadUrl = rom.downloadUrl;
    window.location.hash = id;

    // Breadcrumbs
    const breadcrumbs = document.getElementById('detail-breadcrumbs');
    if (breadcrumbs) {
        breadcrumbs.innerHTML = `
            <a href="#" onclick="event.preventDefault(); navigateHome();">Home</a>
            <span class="sep">/</span>
            <span>${rom.device.split('(')[0].trim()}</span>
            <span class="sep">/</span>
            <span style="color: var(--accent); font-weight: 600;">${rom.name}</span>
        `;
    }

    let displayDate = "-";
    if (build) {
        displayDate = isUpcoming ? "Coming soon" : build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    let descHtml = parseMarkdown(rom.description);
    let notesHtml = parseMarkdown(rom.notes);
    let flashHtml = parseMarkdown(rom.flashInstruction);
    let creditsHtml = parseMarkdown(rom.credits);

    // Save active screenshots array for lightbox
    currentLightboxImages = Array.isArray(rom.screenshots) ? rom.screenshots : [];

    let screenshotsHtml = "";
    if (currentLightboxImages.length > 0) {
        screenshotsHtml = `
            <div class="screenshot-grid" style="margin-top: 20px;">
                ${currentLightboxImages.map((src, idx) => `
                    <img src="${src}" class="screenshot-item" alt="Screenshot ${idx + 1}" loading="lazy" onclick="openLightbox(${idx})">
                `).join('')}
            </div>
        `;
    } else {
        screenshotsHtml = "<p style='color: var(--muted); font-style: italic; margin-top: 20px;'>No screenshots available for this build.</p>";
    }

    let personalWarningHtml = "";
    if (rom.isPersonal) {
        personalWarningHtml = `
            <div style="background: var(--surface-cards); border-left: 4px solid var(--accent); padding: 18px 22px; margin: 15px 0 25px 0; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.15rem; margin-top: 0; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                    ⚠️ Personal Build
                </h3>
                <p style="color: var(--muted); font-size: 0.95rem; margin: 0; line-height: 1.6;">
                    This build is compiled specifically for personal daily driving. It may include custom configs or experimental adjustments. You are welcome to test it, but flash at your own risk.
                </p>
            </div>
        `;
    }

    let downloadButtonHtml = isUpcoming
        ? `<button class="btn-dl secondary" onclick="showUpcomingPopup()" style="padding: 16px 36px; border-color: var(--accent);">Coming Soon</button>`
        : `<button class="btn-dl primary" onclick="showDownloadWarningPopup()" style="padding: 16px 36px;">Download ROM</button>`;

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <div class="rom-detail-banner" style="background-image: url('${rom.banner}');">
            <div class="rom-banner-content">
                <span class="badge-tag ${isUpcoming ? 'upcoming' : 'new'}" style="margin-bottom: 10px;">${isUpcoming ? 'UPCOMING' : 'STABLE'}</span>
                <h1 class="rom-banner-title">${rom.name}</h1>
            </div>
        </div>

        <!-- Quick Specs 4-Card Grid -->
        <div class="detail-specs-grid">
            <div class="spec-card">
                <div class="spec-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                </div>
                <div class="spec-info-col">
                    <span class="spec-label">Target Device</span>
                    <span class="spec-val">${rom.device}</span>
                </div>
            </div>

            <div class="spec-card">
                <div class="spec-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                </div>
                <div class="spec-info-col">
                    <span class="spec-label">Release Date</span>
                    <span class="spec-val">${displayDate}</span>
                </div>
            </div>

            <div class="spec-card">
                <div class="spec-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="spec-info-col">
                    <span class="spec-label">Android Version</span>
                    <span class="spec-val">${rom.version}</span>
                </div>
            </div>

            <div class="spec-card">
                <div class="spec-icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                </div>
                <div class="spec-info-col">
                    <span class="spec-label">Package Type</span>
                    <span class="spec-val">${rom.category || 'ROM'}</span>
                </div>
            </div>
        </div>

        ${personalWarningHtml}

        <div class="rom-info-tabs">
            <button class="tab-btn active" onclick="switchTab('desc')">Changelog & Notes ${isUpcoming ? '<span class="tab-badge-locked">🔒 Coming Soon</span>' : ''}</button>
            <button class="tab-btn" onclick="switchTab('flash')">Flashing Steps</button>
            <button class="tab-btn" onclick="switchTab('screens')">Screenshots (${currentLightboxImages.length})</button>
        </div>

        <div class="rom-description-container">
            <div id="tab-desc" class="tab-content active">
                ${isUpcoming ? `
                    <div class="upcoming-desc-wrapper">
                        <div class="upcoming-desc-body is-blurred" id="upcoming-desc-body">
                            ${descHtml}

                            ${notesHtml ? `
                                <div style="margin-top: 25px;">
                                    <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.25rem; margin-bottom: 12px;">Important Notes</h3>
                                    ${notesHtml}
                                </div>
                            ` : ''}

                            <div style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
                                <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.25rem; margin-bottom: 12px;">Credits & Acknowledgements</h3>
                                ${creditsHtml}
                            </div>
                        </div>

                        <div class="upcoming-sensor-overlay" id="upcoming-sensor-overlay">
                            <div class="upcoming-sensor-card">
                                <div class="upcoming-sensor-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <div class="upcoming-sensor-badge">
                                    <span class="pulse-dot"></span>
                                    <span>COMING SOON</span>
                                </div>
                                <h3 class="upcoming-sensor-title">Description & Changelog Locked</h3>
                                <p class="upcoming-sensor-text">
                                    This build is currently in development and scheduled for release on <strong>${displayDate}</strong>. The full changelog and release notes are kept under wraps until release.
                                </p>
                                <div class="upcoming-sensor-callout">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    <span>Flashing steps and screenshots remain accessible in the tabs above!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    ${descHtml}

                    ${notesHtml ? `
                        <div style="margin-top: 25px;">
                            <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.25rem; margin-bottom: 12px;">Important Notes</h3>
                            ${notesHtml}
                        </div>
                    ` : ''}

                    <div style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
                        <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.25rem; margin-bottom: 12px;">Credits & Acknowledgements</h3>
                        ${creditsHtml}
                    </div>
                `}
            </div>

            <div id="tab-flash" class="tab-content">
                ${flashHtml}
            </div>

            <div id="tab-screens" class="tab-content">
                ${screenshotsHtml}
            </div>
        </div>

        <div style="margin-top: 35px; border-top: 1px solid var(--border); padding-top: 25px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            ${downloadButtonHtml}
            <button class="btn-dl secondary" onclick="shareCurrentRom()" style="padding: 16px 28px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Copy Link
            </button>
        </div>
    `;

    // Process markdown code copy buttons and links
    enhanceMarkdownBlocks(detailContent);

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fullscreen Screenshot Lightbox Functions
function openLightbox(index) {
    if (!currentLightboxImages || currentLightboxImages.length === 0) return;
    currentLightboxIndex = (index >= 0 && index < currentLightboxImages.length) ? index : 0;

    const modal = document.getElementById('lightbox-modal');
    const image = document.getElementById('lightbox-image');
    const counter = document.getElementById('lightbox-counter');

    if (!modal || !image) return;

    image.src = currentLightboxImages[currentLightboxIndex];
    if (counter) {
        counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function nextLightboxImage() {
    if (!currentLightboxImages || currentLightboxImages.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;

    const image = document.getElementById('lightbox-image');
    const counter = document.getElementById('lightbox-counter');

    if (image) {
        image.style.opacity = '0.3';
        image.style.transform = 'scale(0.96)';
        setTimeout(() => {
            image.src = currentLightboxImages[currentLightboxIndex];
            image.style.opacity = '1';
            image.style.transform = 'scale(1)';
        }, 120);
    }
    if (counter) {
        counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    }
}

function prevLightboxImage() {
    if (!currentLightboxImages || currentLightboxImages.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;

    const image = document.getElementById('lightbox-image');
    const counter = document.getElementById('lightbox-counter');

    if (image) {
        image.style.opacity = '0.3';
        image.style.transform = 'scale(0.96)';
        setTimeout(() => {
            image.src = currentLightboxImages[currentLightboxIndex];
            image.style.opacity = '1';
            image.style.transform = 'scale(1)';
        }, 120);
    }
    if (counter) {
        counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    }
}

// Swipe gestures for lightbox on mobile
let touchStartX = 0;
let touchEndX = 0;
const lightboxModal = document.getElementById('lightbox-modal');
if (lightboxModal) {
    lightboxModal.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            nextLightboxImage(); // swipe left -> next
        } else if (touchEndX - touchStartX > 50) {
            prevLightboxImage(); // swipe right -> prev
        }
    }, { passive: true });
}

// Router & Deep Linking
function handleRouting() {
    if (isEggTriggered) return;
    const hash = window.location.hash;

    if (hash === '#personal') {
        isSecretMode = true;
        navigateHome(true);
    } else if (hash && hash.length > 1) {
        const romId = decodeURIComponent(hash.substring(1));
        const detailContainer = document.getElementById('detail-content');
        if (detailContainer) {
            detailContainer.innerHTML = '<div style="text-align: center; padding: 100px; color: var(--accent); font-family: \'Syne\', sans-serif;">Loading build details...</div>';
            setTimeout(() => {
                viewDetail(romId);
            }, 150);
        } else {
            viewDetail(romId);
        }
    } else {
        isSecretMode = false;
        navigateHome(false);
    }
}

window.addEventListener('hashchange', () => {
    handleRouting();
});

// Modal Helpers
function closeModal() {
    const mdModal = document.getElementById('md-modal');
    if (mdModal) mdModal.style.display = 'none';
}

function closeReaderModal() {
    const readerModal = document.getElementById('reader-modal');
    if (readerModal) readerModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};

// Falling Leaves Ambient Background Particle System
let leafParticles = [];
let windTime = 0;
let wind = {
    currentX: -3.5, targetX: -3.5,
    currentY: 2.2, targetY: 2.2
};
let isLeafAnimationRunning = false;

function createLeaves() {
    let container = document.getElementById('leaf-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'leaf-container';
        document.body.prepend(container);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // respect user preference
    }

    const leafCount = 14;
    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');

        const size = Math.random() * 22 + 22;
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.opacity = (Math.random() * 0.25 + 0.08).toFixed(2);
        leaf.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M 4 20 C 4 10 14 4 20 4 C 20 14 10 20 4 20 Z"/></svg>`;

        container.appendChild(leaf);

        leafParticles.push({
            el: leaf,
            x: window.innerWidth * Math.random() + (window.innerWidth * 0.2),
            y: Math.random() * window.innerHeight - window.innerHeight,
            size: size,
            mass: size / 22,
            flutter: Math.random() * Math.PI * 2,
            flutterSpeed: 0.015 + Math.random() * 0.02,
            baseRotation: 45
        });
    }

    isLeafAnimationRunning = true;
    requestAnimationFrame(animateLeaves);

    // Pause when tab not visible to conserve battery
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isLeafAnimationRunning = false;
        } else {
            if (!isLeafAnimationRunning) {
                isLeafAnimationRunning = true;
                requestAnimationFrame(animateLeaves);
            }
        }
    });
}

function animateLeaves() {
    if (!isLeafAnimationRunning) return;

    windTime += 0.015;
    wind.targetX = -4 + Math.sin(windTime) * 2.5;
    wind.targetY = 2.2 + Math.cos(windTime * 0.8) * 1.2;

    wind.currentX += (wind.targetX - wind.currentX) * 0.05;
    wind.currentY += (wind.targetY - wind.currentY) * 0.05;

    leafParticles.forEach(p => {
        let swoop = Math.sin(p.flutter) * 1.5;
        let vx = wind.currentX * p.mass + swoop;
        let vy = wind.currentY * p.mass;

        p.x += vx;
        p.y += vy;
        p.flutter += p.flutterSpeed;

        let angle = Math.atan2(vy, vx) * (180 / Math.PI);
        let sway = Math.sin(p.flutter) * 18;

        if (p.y > window.innerHeight + 50 || p.x < -50) {
            if (Math.random() > 0.5) {
                p.y = -50;
                p.x = (window.innerWidth * 0.2) + Math.random() * window.innerWidth;
            } else {
                p.x = window.innerWidth + 50;
                p.y = -50 + Math.random() * (window.innerHeight * 0.8);
            }
        }

        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${angle + p.baseRotation + sway}deg)`;
    });

    requestAnimationFrame(animateLeaves);
}

// Announcement Banner Loader
async function loadAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    const textContainer = document.getElementById('announcement-text');
    const closeBtn = document.getElementById('close-banner');

    if (!banner || !textContainer || !closeBtn) return;

    // Check if user dismissed it in this session
    if (sessionStorage.getItem('butterscotch-banner-dismissed')) {
        return;
    }

    try {
        const response = await fetch('assets/announcement.txt?t=' + Date.now());
        if (response.ok) {
            const rawText = await response.text();
            if (!rawText.trim()) return;

            const blocks = rawText.replace(/\r/g, '').split('===');
            const now = new Date();
            let activeMessages = [];

            blocks.forEach(block => {
                const lines = block.trim().split('\n');
                if (lines.length >= 3) {
                    const startDateStr = lines[0].trim();
                    const endDateStr = lines[1].trim();
                    const messageText = lines.slice(2).join('\n').trim();

                    const startDate = getGMT8Target(startDateStr);
                    const endDate = getGMT8Target(endDateStr);

                    if (now >= startDate && now <= endDate && messageText.length > 0) {
                        activeMessages.push(messageText);
                    }
                }
            });

            if (activeMessages.length > 0) {
                let finalHtml = "";
                activeMessages.forEach((msg, index) => {
                    let parsedMessage = "";
                    if (window.marked && typeof window.marked.parse === 'function') {
                        parsedMessage = window.marked.parse(msg);
                    } else {
                        parsedMessage = msg.replace(/\n/g, '<br>');
                    }
                    if (index > 0) {
                        finalHtml += `<hr style="border:0; border-top:1px dashed var(--border); margin: 12px 0;">`;
                    }
                    finalHtml += parsedMessage;
                });

                textContainer.innerHTML = finalHtml;
                banner.classList.remove('hidden');

                setTimeout(() => {
                    const bannerTextContainer = document.getElementById('banner-text');
                    const expandBtn = document.getElementById('expand-btn');

                    if (bannerTextContainer && expandBtn) {
                        if (bannerTextContainer.scrollHeight > 50) {
                            expandBtn.style.display = 'block';
                            expandBtn.onclick = () => {
                                bannerTextContainer.classList.toggle('expanded');
                                expandBtn.textContent = bannerTextContainer.classList.contains('expanded') ? 'View less' : 'View more';
                            };
                        }
                    }
                }, 60);

                closeBtn.onclick = () => {
                    banner.classList.add('hidden');
                    sessionStorage.setItem('butterscotch-banner-dismissed', 'true');
                };
            }
        }
    } catch (error) {}
}
