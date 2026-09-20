/**
 * Butterscotch Web - Main Application Script
 * Enhanced UI, Animations, Search, Filtering, Lightbox & Functionality
 */

let currentCategory = 'All';
let currentDeviceFilter = 'All';
let currentSearchQuery = '';
let currentSortOrder = 'newest';
let activeDownloadUrl = '';
let isSecretMode = false;
let isYttaMode = false;
try {
    if (sessionStorage.getItem('butterscotch-ytta') === 'true') {
        isYttaMode = true;
    }
} catch (e) {}

function updateYttaUi() {
    const badge = document.getElementById('ytta-nav-badge');
    if (badge) {
        badge.style.display = isYttaMode ? 'inline-flex' : 'none';
    }
}

function exitYttaMode() {
    isYttaMode = false;
    try {
        sessionStorage.removeItem('butterscotch-ytta');
    } catch (e) {}
    updateYttaUi();
    showToast('🔒 Debug Mode deactivated', 'info', 2500);
    renderROMCards();
    const detailPage = document.getElementById('page-detail');
    if (detailPage && detailPage.classList.contains('active')) {
        const hash = window.location.hash ? window.location.hash.substring(1) : '';
        if (hash) {
            viewDetail(hash);
        } else {
            navigateHome(false);
        }
    }
}

// YTTA Debug Mode & PIN Security System (PIN: 1225)
const YTTA_DEBUG_PIN = '1225';

function openPinModal() {
    const modal = document.getElementById('pin-modal');
    const input = document.getElementById('ytta-pin-input');
    const errorMsg = document.getElementById('pin-error-msg');
    if (!modal) return;

    if (errorMsg) errorMsg.style.display = 'none';
    if (input) {
        input.value = '';
        input.classList.remove('pin-input-error');
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        if (input) input.focus();
    }, 120);
}

function closePinModal(authorized = false) {
    const modal = document.getElementById('pin-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';

    if (!authorized) {
        const hash = window.location.hash;
        if (hash === '#ytta' || hash === '#debug') {
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } else {
                window.location.hash = '';
            }
            navigateHome(false);
        }
    }
}

function appendPinDigit(digit) {
    const input = document.getElementById('ytta-pin-input');
    const errorMsg = document.getElementById('pin-error-msg');
    if (!input) return;
    if (errorMsg) errorMsg.style.display = 'none';
    input.classList.remove('pin-input-error');

    if (input.value.length < 4) {
        input.value += digit;
        if (input.value.length === 4) {
            setTimeout(() => {
                verifyPin();
            }, 120);
        }
    }
}

function deletePinDigit() {
    const input = document.getElementById('ytta-pin-input');
    const errorMsg = document.getElementById('pin-error-msg');
    if (!input) return;
    if (errorMsg) errorMsg.style.display = 'none';
    input.classList.remove('pin-input-error');
    input.value = input.value.slice(0, -1);
}

function clearPinInput() {
    const input = document.getElementById('ytta-pin-input');
    const errorMsg = document.getElementById('pin-error-msg');
    if (!input) return;
    if (errorMsg) errorMsg.style.display = 'none';
    input.classList.remove('pin-input-error');
    input.value = '';
    input.focus();
}

function verifyPin() {
    const input = document.getElementById('ytta-pin-input');
    const modalContent = document.querySelector('.ytta-pin-modal-content');
    const errorMsg = document.getElementById('pin-error-msg');
    if (!input) return;

    const enteredPin = String(input.value).trim();
    if (enteredPin === YTTA_DEBUG_PIN) {
        try {
            sessionStorage.setItem('butterscotch-ytta', 'true');
        } catch (e) {}
        isYttaMode = true;
        closePinModal(true);
        updateYttaUi();
        renderROMCards();
        showToast('🔓 Access Granted: Debug Mode Unlocked!', 'success', 2800);
        redirectToUpcomingRom();
    } else {
        if (modalContent) {
            modalContent.classList.remove('pin-shake');
            void modalContent.offsetWidth; // Force reflow
            modalContent.classList.add('pin-shake');
        }
        input.classList.add('pin-input-error');
        if (errorMsg) errorMsg.style.display = 'flex';
        showToast('❌ Incorrect PIN. Access denied.', 'error', 2500);
        setTimeout(() => {
            input.value = '';
            input.focus();
        }, 350);
    }
}

function redirectToUpcomingRom() {
    const upcomingRom = (window.romData && window.romData.find(r => {
        const b = r.buildDate ? getGMT8Target(r.buildDate) : null;
        return b && b > new Date();
    })) || (window.romData && window.romData.find(r => r.id === 'kun_nos5'));

    if (upcomingRom) {
        viewDetail(upcomingRom.id);
    } else {
        navigateHome(false);
    }
}

function handleYttaRouting() {
    if (isYttaMode) {
        showToast('🔓 Debug Mode active', 'info', 2000);
        redirectToUpcomingRom();
        return;
    }

    try {
        if (sessionStorage.getItem('butterscotch-ytta') === 'true') {
            isYttaMode = true;
            updateYttaUi();
            showToast('🔓 Debug Mode active', 'info', 2000);
            redirectToUpcomingRom();
            return;
        }
    } catch (e) {}

    openPinModal();
}

function initPinInputListeners() {
    const input = document.getElementById('ytta-pin-input');
    if (!input) return;
    input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 4);
        const errorMsg = document.getElementById('pin-error-msg');
        if (errorMsg) errorMsg.style.display = 'none';
        input.classList.remove('pin-input-error');
        if (input.value.length === 4) {
            setTimeout(() => {
                verifyPin();
            }, 120);
        }
    });
}

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

// Dynamic Theme CSS loader (smooth, robust stylesheet switching without getting stuck)
let currentActiveCssSuffix = '-emerald';
if (!document.documentElement.hasAttribute('data-css-theme')) {
    document.documentElement.setAttribute('data-css-theme', '-emerald');
}

function updateCSS(suffix) {
    const desiredSuffix = suffix || '-emerald';
    const targetFile = 'assets/css/style' + desiredSuffix + '.css';
    const targetHref = targetFile + '?v=39';
    let mainLink = document.getElementById('main-css');

    // 1. Immediately set data-css-theme on <html> for instant reactive synchronization
    document.documentElement.setAttribute('data-css-theme', desiredSuffix);

    // 2. Immediately notify ribbons canvas so the color starts changing with ZERO network wait!
    if (typeof window.updateRibbonTheme === 'function') {
        window.updateRibbonTheme(desiredSuffix);
    }
    window.dispatchEvent(new CustomEvent('ribbonThemeUpdate', { detail: desiredSuffix }));

    // If mainLink exists and already points to the desired stylesheet, and suffix matches, no-op
    if (currentActiveCssSuffix === desiredSuffix && mainLink && mainLink.getAttribute('href') && mainLink.getAttribute('href').includes(targetFile)) {
        return;
    }

    currentActiveCssSuffix = desiredSuffix;

    const onCssLoaded = () => {
        if (typeof window.updateRibbonTheme === 'function') {
            window.updateRibbonTheme(desiredSuffix);
        }
    };

    if (mainLink) {
        // Direct in-place href update: deterministic, instantaneous, preserves DOM order before style-components.css
        mainLink.href = targetHref;
        mainLink.addEventListener('load', onCssLoaded, { once: true });
    } else {
        // Fallback: create #main-css and insert BEFORE style-components.css
        mainLink = document.createElement('link');
        mainLink.id = 'main-css';
        mainLink.rel = 'stylesheet';
        mainLink.href = targetHref;
        mainLink.addEventListener('load', onCssLoaded, { once: true });

        const componentsLink = document.querySelector('link[href*="style-components"]');
        if (componentsLink && componentsLink.parentNode) {
            componentsLink.parentNode.insertBefore(mainLink, componentsLink);
        } else {
            document.head.prepend(mainLink);
        }
    }

    // Safety sweep: purge any duplicate or rogue theme link elements left in <head>
    const themeLinks = document.querySelectorAll('link[href*="style-emerald"], link[href*="style-gold"], link[href*="style-red"], link[href*="style-sakura"], link[href*="style."]');
    themeLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (link.id !== 'main-css' && !href.includes('style-components')) {
            link.remove();
        }
    });

    // Multi-interval check to guarantee synchronization even under slow network
    [50, 150, 300, 600].forEach(delay => {
        setTimeout(() => {
            if (typeof window.updateRibbonTheme === 'function') {
                window.updateRibbonTheme(desiredSuffix);
            }
        }, delay);
    });
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
                <div class="skeleton-shimmer" style="width: 100%; height: 40px; background: var(--surface); border-radius: 8px; margin-top: auto;"></div>
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
        if (!item.category) {
            const n = (item.name || '').toLowerCase();
            item.category = (n.includes('hyperos') || n.includes('miui'))
                ? 'Xiaomi (HyperOS, MIUI)'
                : 'Non-Xiaomi';
        }
    });

    // Update dynamic statistics in Hero section
    updateHeroStats();

    // Auto-fill footer year
    const currentYearStr = new Date().getFullYear();
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = currentYearStr;

    // Theme Management (Light / Dark)
    initThemeManager();

    // Remove leaf container if present
    const existingLeafContainer = document.getElementById('leaf-container');
    if (existingLeafContainer) existingLeafContainer.remove();

    // Setup Filter Hub & Search
    initSearchAndFilters();

    // Initial Renders
    renderCategoryFilters();
    renderDeviceFilterChips();
    renderROMCards();

    // Announcement & Router
    loadAnnouncement();
    handleRouting();
    updateYttaUi();
    initPinInputListeners();

    // Keyboard Shortcuts
    initKeyboardShortcuts();

    // Mobile Gestures & Ergonomics
    initLightboxTouchGestures();
    initScrollToTop();
    adjustMobilePlaceholders();
    window.addEventListener('resize', adjustMobilePlaceholders);
});

// Update Hero Statistics
function updateHeroStats() {
    if (!window.romData) return;
    const totalRomsEl = document.getElementById('stat-total-roms');
    const totalDevicesEl = document.getElementById('stat-total-devices');
    const androidVersionsEl = document.getElementById('stat-android-versions');

    if (totalRomsEl) {
        totalRomsEl.textContent = window.romData.length;
    }
    if (totalDevicesEl) {
        const uniqueDevices = new Set(window.romData.map(r => r.device));
        totalDevicesEl.textContent = uniqueDevices.size;
    }
    if (androidVersionsEl) {
        const versions = window.romData
            .map(r => {
                const match = String(r.version || '').match(/Android\s*(\d+)/i);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(v => v !== null && !isNaN(v));

        if (versions.length > 0) {
            const minVer = Math.min(...versions);
            const maxVer = Math.max(...versions);
            androidVersionsEl.textContent = minVer === maxVer ? `${minVer}` : `${minVer} - ${maxVer}`;
        }
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

        if (typeof window.updateRibbonTheme === 'function') {
            window.updateRibbonTheme();
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

            // Check pin modal
            const pinModal = document.getElementById('pin-modal');
            if (pinModal && pinModal.style.display !== 'none') {
                closePinModal(false);
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

    const uniqueCats = [...new Set(visibleData.map(rom => rom.category).filter(Boolean))];
    uniqueCats.sort((a, b) => {
        if (a.includes('Xiaomi') && !a.includes('Non')) return -1;
        if (b.includes('Xiaomi') && !b.includes('Non')) return 1;
        return a.localeCompare(b);
    });

    const categories = ['All', ...uniqueCats];
    if (!categories.includes(currentCategory)) {
        currentCategory = 'All';
    }

    let catHtml = '';
    categories.forEach(cat => {
        const count = cat === 'All'
            ? visibleData.length
            : visibleData.filter(r => r.category === cat).length;
        const activeClass = currentCategory === cat ? 'active' : '';
        const label = cat === 'All' ? 'All ROMs' : cat;
        catHtml += `<button class="filter-btn ${activeClass}" onclick="setCategory('${cat}')">${label} <span class="filter-btn-count" style="opacity: 0.75; font-size: 0.8rem; margin-left: 4px;">(${count})</span></button>`;
    });

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
            <div style="grid-column: 1 / -1; padding: 30px; background: rgba(255, 107, 107, 0.1); border: 1px dashed #ff6b6b; border-radius: 12px; text-align: center;">
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
    if (currentCategory !== 'All') {
        filteredData = filteredData.filter(rom => (rom.category || 'Non-Xiaomi') === currentCategory);
    }

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
            const cat = (rom.category || '').toLowerCase();
            return name.includes(currentSearchQuery) ||
                   dev.includes(currentSearchQuery) ||
                   ver.includes(currentSearchQuery) ||
                   desc.includes(currentSearchQuery) ||
                   notes.includes(currentSearchQuery) ||
                   cat.includes(currentSearchQuery);
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
    let globalCardIdx = 0;

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

        const deviceCategories = [...new Set(deviceRoms.map(r => r.category || 'Non-Xiaomi'))];
        deviceCategories.sort((a, b) => {
            if (a.includes('Xiaomi') && !a.includes('Non')) return -1;
            if (b.includes('Xiaomi') && !b.includes('Non')) return 1;
            return a.localeCompare(b);
        });

        const shouldShowCategoryHeaders = currentCategory === 'All' && deviceCategories.length > 1;

        deviceCategories.forEach(cat => {
            const catRoms = deviceRoms.filter(r => (r.category || 'Non-Xiaomi') === cat);
            if (catRoms.length === 0) return;

            if (shouldShowCategoryHeaders) {
                htmlContent += `
                    <div style="grid-column: 1 / -1; margin-top: 18px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; padding: 7px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);">
                        <span style="font-family: 'Syne', sans-serif; font-size: 0.92rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            ${cat}
                        </span>
                        <span style="font-size: 0.8rem; color: var(--muted); font-weight: 600;">${catRoms.length} build${catRoms.length === 1 ? '' : 's'}</span>
                    </div>
                `;
            }

            htmlContent += catRoms.map((rom) => {
                let badgeHtml = "";
                let displayDate = "-";
                const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
                const now = new Date();
                const isWip = !!rom.isWip;
                const isUpcoming = !isWip && build && build > now;
                const isUnlockedByYtta = isUpcoming && isYttaMode;
                const isNuked = !isWip && !isUpcoming && (!rom.downloadUrl || rom.downloadUrl.trim() === "");

                let cardAction = `onclick="viewDetail('${rom.id}')"`;
                let cursorStyle = "cursor: pointer;";
                let btnText = isUnlockedByYtta ? 'View Details (Debug)' : 'View Details';
                let btnClass = "btn-dl primary btn-card-main";
                let btnStyle = "";

                // Extract codename from device
                const matchCodename = (rom.device || '').match(/\(([^)]+)\)/);
                const codename = matchCodename ? matchCodename[1] : '';

                // Extract Android version pill
                const matchAndroid = (rom.version || '').match(/(Android\s*\d+)/i);
                const androidPill = matchAndroid ? matchAndroid[1] : 'Android';

                if (isWip) {
                    badgeHtml += `<span class="badge-tag wip">WIP</span>`;
                    cardAction = `onclick="showWipPopup()"`;
                    cursorStyle = "cursor: pointer;";
                    btnText = "Under Development";
                    btnStyle = "opacity: 0.75;";
                    btnClass = "btn-dl secondary btn-card-main";
                    displayDate = "Work in Progress";
                } else if (isNuked) {
                    badgeHtml += `<span class="badge-tag nuked">NUKED</span>`;
                    cardAction = `onclick="showNukedPopup()"`;
                    cursorStyle = "cursor: pointer;";
                    btnText = "Unavailable";
                    btnStyle = "opacity: 0.6;";
                    btnClass = "btn-dl secondary btn-card-main";
                    displayDate = "Unavailable";
                } else if (isUpcoming) {
                    if (isUnlockedByYtta) {
                        badgeHtml += `<span class="badge-tag upcoming" style="background: var(--accent); color: #032313; font-weight: 700;">UNLOCKED</span>`;
                        displayDate = build ? `${build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} (Upcoming)` : 'Coming soon';
                    } else {
                        badgeHtml += `<span class="badge-tag upcoming">UPCOMING</span>`;
                        displayDate = "Coming soon";
                    }
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

                let bannerContent = (isNuked || isWip)
                    ? `<div class="nuked-banner-noise" style="width: 100%; height: 100%;"></div>`
                    : `<div class="card-banner-img" style="background-image: url('${rom.banner}');"></div>`;

                const animDelay = (globalCardIdx++ * 0.04).toFixed(2);

                return `
                <div class="rom-card" ${cardAction} style="${cursorStyle} animation-delay: ${animDelay}s;">
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
    });

    container.innerHTML = htmlContent;
}

// Reset filters helper
function resetSearchAndFilters() {
    currentSearchQuery = '';
    currentDeviceFilter = 'All';
    currentCategory = 'All';
    const searchInput = document.getElementById('rom-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    renderCategoryFilters();
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
    updateCSS('-emerald');

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

    document.body.classList.remove('has-sticky-bar');
    document.body.style.overflow = '';
    closeModal();
    closeReaderModal();
    const existingStickyBar = document.getElementById('mobile-sticky-bar');
    if (existingStickyBar) existingStickyBar.remove();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderCategoryFilters();
    renderDeviceFilterChips();
    renderROMCards();
}

// 404 Error Page
function show404() {
    updateCSS('-emerald');
    document.body.classList.remove('has-sticky-bar');
    const existingStickyBar = document.getElementById('mobile-sticky-bar');
    if (existingStickyBar) existingStickyBar.remove();

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
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h2 class="modal-popup-title">Stay Tuned!</h2>
            <p class="modal-popup-text">
                This build is actively in development. Direct downloads will be posted as soon as testing completes.
            </p>
            <div class="modal-actions-row">
                <button class="btn-dl primary" onclick="closeModal()">Got it</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showNukedPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </div>
            <h2 class="modal-popup-title danger">Build Withdrawn</h2>
            <p class="modal-popup-text">
                This ROM build has been deprecated or nuked due to newer releases or issues. Details and files are no longer accessible.
            </p>
            <div class="modal-actions-row">
                <button class="btn-dl primary" onclick="closeModal()">Understood</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showWipPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box warning">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </div>
            <h2 class="modal-popup-title warning">Work in Progress</h2>
            <p class="modal-popup-text">
                This ROM is actively under development and initial testing. Build details, changelogs, and downloads are not yet available.
            </p>
            <div class="modal-actions-row">
                <button class="btn-dl primary" onclick="closeModal()">Understood</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showDownloadWarningPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 class="modal-popup-title danger">
                Important Flashing Notice
            </h2>

            <div class="modal-popup-notice">
                <strong class="modal-popup-notice-title">
                    Your warranty is now void.
                </strong>
                <p>
                    We are not responsible for bricked devices, dead SD cards, or thermonuclear war. Please verify instructions carefully before flashing! You choose to install this at your own discretion.
                </p>
            </div>

            <div class="modal-actions-row">
                <button class="btn-dl primary" onclick="proceedDownload()">Proceed to Download</button>
                <button class="btn-dl secondary" onclick="copyActiveDownloadUrl()">Copy Link</button>
                <button class="btn-dl secondary" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
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

    if (rom.isWip) {
        showWipPopup();
        window.location.hash = isSecretMode ? 'personal' : '';
        return;
    }

    // Apply theme suffix if defined (e.g. sakura, emerald, gold, red)
    updateCSS(rom.cssSuffix || '-emerald');

    const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
    const now = new Date();
    const isUpcoming = build && build > now;
    const isUnlockedByYtta = isUpcoming && isYttaMode;
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
    let formattedReleaseDate = "";
    if (build) {
        formattedReleaseDate = build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        if (isUnlockedByYtta) {
            displayDate = `${formattedReleaseDate} (Upcoming Preview)`;
        } else {
            displayDate = isUpcoming ? "Coming soon" : formattedReleaseDate;
        }
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
            <div class="screenshot-hint-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                <span>Tap screenshot for fullscreen • Swipe left/right to browse</span>
            </div>
            <div class="screenshot-grid">
                ${currentLightboxImages.map((src, idx) => `
                    <div class="screenshot-card" onclick="openLightbox(${idx})" title="Screenshot ${idx + 1}">
                        <img src="${src}" class="screenshot-item" alt="Screenshot ${idx + 1}" loading="lazy">
                        <div class="screenshot-overlay">
                            <span class="screenshot-counter-badge">${idx + 1} / ${currentLightboxImages.length}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        screenshotsHtml = "<p style='color: var(--muted); font-style: italic; margin-top: 20px;'>No screenshots available for this build.</p>";
    }

    let personalWarningHtml = "";
    if (rom.isPersonal) {
        personalWarningHtml = `
            <div style="background: var(--surface-cards); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 16px 20px; margin: 15px 0 25px 0; border-radius: var(--radius-sm);">
                <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.15rem; margin-top: 0; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                    ⚠️ Personal Build
                </h3>
                <p style="color: var(--muted); font-size: 0.95rem; margin: 0; line-height: 1.6;">
                    This build is compiled specifically for personal daily driving. It may include custom configs or experimental adjustments. You are welcome to test it, but flash at your own risk.
                </p>
            </div>
        `;
    }

    let downloadButtonHtml = (isUpcoming && !isUnlockedByYtta)
        ? `<button class="btn-dl secondary" onclick="showUpcomingPopup()" style="border-color: var(--accent);">Coming Soon</button>`
        : `<button class="btn-dl primary" onclick="showDownloadWarningPopup()">${isUnlockedByYtta ? 'Download ROM (Debug Unlocked)' : 'Download ROM'}</button>`;

    let bannerBadgeHtml = isUpcoming
        ? (isUnlockedByYtta ? '<span class="badge-tag upcoming" style="background: var(--accent); color: #032313; font-weight: 700; margin-bottom: 10px;">UNLOCKED PREVIEW</span>' : '<span class="badge-tag upcoming" style="margin-bottom: 10px;">UPCOMING</span>')
        : '<span class="badge-tag new" style="margin-bottom: 10px;">STABLE</span>';

    let tabDescBadgeHtml = '';
    if (isUpcoming) {
        if (isUnlockedByYtta) {
            tabDescBadgeHtml = `<span class="tab-badge-unlocked"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px; vertical-align:-1px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>Unlocked</span>`;
        } else {
            tabDescBadgeHtml = `<span class="tab-badge-locked"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px; vertical-align:-1px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>Locked</span>`;
        }
    }

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <div class="rom-detail-banner" style="background-image: url('${rom.banner}');">
            <div class="rom-banner-content">
                ${bannerBadgeHtml}
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
                    <span class="spec-label">Category</span>
                    <span class="spec-val">${rom.category || 'Non-Xiaomi'}</span>
                </div>
            </div>
        </div>

        ${personalWarningHtml}

        <div class="rom-info-tabs">
            <button class="tab-btn active" onclick="switchTab('desc')">Changelog & Notes ${tabDescBadgeHtml}</button>
            <button class="tab-btn" onclick="switchTab('flash')">Flashing Steps</button>
            <button class="tab-btn" onclick="switchTab('screens')">Screenshots (${currentLightboxImages.length})</button>
        </div>

        <div class="rom-description-container">
            <div id="tab-desc" class="tab-content active">
                ${(isUpcoming && !isUnlockedByYtta) ? `
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
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
                                    This build is currently in active development. The release schedule, changelog, and release notes are kept secret until official release.
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
                    ${isUnlockedByYtta ? `
                        <div class="ytta-debug-banner">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); flex-shrink: 0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <div>
                                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--accent); font-family: 'Syne', sans-serif;">Debug Mode Active</div>
                                    <div style="font-size: 0.8rem; color: var(--muted); margin-top: 2px;">Pre-release specifications, changelog, and build preview unlocked for testing.</div>
                                </div>
                            </div>
                            <button class="ytta-exit-btn" onclick="exitYttaMode()">Exit Debug</button>
                        </div>
                    ` : ''}

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

        <div class="detail-actions-row">
            ${downloadButtonHtml}
            <button class="btn-dl secondary" onclick="shareCurrentRom()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Copy Link
            </button>
        </div>

        <!-- Sticky Mobile Bottom Bar -->
        <div class="mobile-sticky-bar" id="mobile-sticky-bar">
            <div class="sticky-bar-info">
                <span class="sticky-rom-name">${rom.name}</span>
                <span class="sticky-rom-meta">${rom.device.split('(')[0].trim()} • ${rom.version}</span>
            </div>
            <div class="sticky-bar-actions">
                ${(isUpcoming && !isUnlockedByYtta)
                    ? `<button class="btn-dl secondary sticky-dl-btn" onclick="showUpcomingPopup()">Soon</button>`
                    : `<button class="btn-dl primary sticky-dl-btn" onclick="showDownloadWarningPopup()">${isUnlockedByYtta ? 'Download (Debug)' : 'Download'}</button>`
                }
            </div>
        </div>
    `;

    // Process markdown code copy buttons and links
    enhanceMarkdownBlocks(detailContent);

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
    document.body.classList.add('has-sticky-bar');

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

// Lightbox Touch Swipe Gestures (Horizontal navigation & vertical dismiss)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function initLightboxTouchGestures() {
    const lightboxModal = document.getElementById('lightbox-modal');
    if (!lightboxModal) return;

    lightboxModal.addEventListener('touchstart', e => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', e => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        // Horizontal swipe navigation (minimum 40px threshold)
        if (absX > 40 && absX > absY) {
            if (diffX < 0) {
                nextLightboxImage(); // swipe left -> next
            } else {
                prevLightboxImage(); // swipe right -> prev
            }
        } else if (diffY > 75 && absY > absX) {
            // Vertical swipe down -> close preview
            closeLightbox();
        }
    }, { passive: true });
}

// Quick Scroll to Top button handler
function initScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Responsive search input placeholder for mobile devices
function adjustMobilePlaceholders() {
    const searchInput = document.getElementById('rom-search-input');
    if (!searchInput) return;
    if (window.innerWidth <= 640) {
        searchInput.placeholder = 'Search ROMs or devices...';
    } else {
        searchInput.placeholder = 'Search ROM, Android version, or device (fog, earth, gale, kunzite)...';
    }
}

// Router & Deep Linking
function handleRouting() {
    if (isEggTriggered) return;
    const hash = window.location.hash;

    if (hash === '#personal') {
        isSecretMode = true;
        navigateHome(true);
    } else if (hash === '#ytta' || hash === '#debug') {
        handleYttaRouting();
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
    document.body.style.overflow = '';
}

function closeReaderModal() {
    const readerModal = document.getElementById('reader-modal');
    if (readerModal) readerModal.style.display = 'none';
    document.body.style.overflow = '';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'pin-modal') {
            closePinModal(false);
        } else {
            event.target.style.display = "none";
            document.body.style.overflow = '';
        }
    }
};



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
