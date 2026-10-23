/**
 * Butterscotch Web - Main Application Script
 * Clean, High-Performance, Modular Architecture
 */

let currentCategory = 'All';
let currentDeviceFilter = 'All';
let currentSearchQuery = '';
let currentSortOrder = 'newest';
let activeDownloadUrl = '';
let isSecretMode = false;
let isYttaMode = false;

// Check sessionStorage for Debug Mode
try {
    if (sessionStorage.getItem('butterscotch-ytta') === 'true') {
        isYttaMode = true;
    }
} catch (e) {}

// Lightbox state
let currentLightboxImages = [];
let currentLightboxIndex = 0;

// Easter Egg state
let spamCount = 0;
let spamTimeout = null;
let isEggTriggered = false;
let lastOpenedRomId = null;
let spamTarget = Math.floor(Math.random() * 8) + 6;

// PIN constant
const YTTA_DEBUG_PIN = '1225';

// Date utility: convert GMT+8 date string safely
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

// Dynamic Theme CSS Loader
window.updateCSS = updateCSS;
function updateCSS(suffix) {
    let desiredSuffix = suffix || '-blue';
    if (desiredSuffix === '-biru' || desiredSuffix === '-helloui') desiredSuffix = '-blue';
    if (desiredSuffix === '-coklat' || desiredSuffix === '-mocha') desiredSuffix = '-brown';
    if (desiredSuffix === '-abu' || desiredSuffix === '-grey' || desiredSuffix === '-slate') desiredSuffix = '-gray';
    document.documentElement.setAttribute('data-css-theme', desiredSuffix);
}

// Toast Notification System
function showToast(message, type = 'info', duration = 2800) {
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
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// YTTA / Debug Mode UI & PIN Management
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
    showToast('Debug Mode deactivated', 'info', 2000);
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

    openModal(modal);

    setTimeout(() => {
        if (input) input.focus();
    }, 100);
}

function closePinModal(authorized = false) {
    const modal = document.getElementById('pin-modal');
    if (modal) {
        modal.classList.add('closing');
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.classList.contains('closing')) {
                modal.style.display = 'none';
                modal.classList.remove('closing');
            }
        }, 220);
    }
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
            setTimeout(verifyPin, 100);
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
        showToast('Access Granted: Debug Mode Unlocked!', 'success', 2800);
        redirectToUpcomingRom();
    } else {
        if (modalContent) {
            modalContent.classList.remove('pin-shake');
            void modalContent.offsetWidth; // Reflow
            modalContent.classList.add('pin-shake');
        }
        input.classList.add('pin-input-error');
        if (errorMsg) errorMsg.style.display = 'flex';
        showToast('Incorrect PIN. Access denied.', 'error', 2200);
        setTimeout(() => {
            input.value = '';
            input.focus();
        }, 300);
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
        showToast('Debug Mode active', 'info', 1800);
        redirectToUpcomingRom();
        return;
    }
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
            setTimeout(verifyPin, 100);
        }
    });
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

    const img = document.createElement('img');
    img.src = 'assets/tree.gif';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100vh';
    img.style.objectFit = 'contain';
    document.body.appendChild(img);

    try {
        const audio = new Audio('assets/man.ogg');
        audio.loop = true;
        audio.play().catch(() => {});
    } catch (e) {}
}

function preloadAssets() {
    // Only preload lightweight image; audio is loaded only if easter egg is actually triggered
    try {
        const img = new Image();
        img.src = 'assets/tree.gif';
    } catch (e) {}
}

// Application Initialization
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
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // Theme Management (Light / Dark)
    initThemeManager();

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

    // Keyboard Shortcuts & Gestures
    initKeyboardShortcuts();
    initLightboxTouchGestures();
    initScrollToTop();
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

// Theme Management System (Follows System Preference & Syncs Live)
function initThemeManager() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const metaThemeColor = document.getElementById('meta-theme-color');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function updateIconsAndMeta(theme) {
        if (theme === 'light') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
            if (metaThemeColor) metaThemeColor.setAttribute('content', '#f8fafc');
        } else {
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
            if (metaThemeColor) metaThemeColor.setAttribute('content', '#07080a');
        }
    }

    function applyTheme(theme, save = true) {
        html.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('butterscotch-theme', theme);
        }
        updateIconsAndMeta(theme);
    }

    // Determine initial theme: saved preference or system preference
    const savedTheme = localStorage.getItem('butterscotch-theme');
    const systemTheme = mediaQuery.matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    applyTheme(activeTheme, false);

    // Live sync with system theme changes
    const handleSystemChange = (e) => {
        // When system theme changes, automatically follow the new system theme
        const newSystemTheme = e.matches ? 'dark' : 'light';
        localStorage.removeItem('butterscotch-theme');
        applyTheme(newSystemTheme, false);
    };

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemChange);
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme, true);
        });
    }
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
            }, 100);
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
            const lightbox = document.getElementById('lightbox-modal');
            if (lightbox && lightbox.style.display !== 'none') {
                closeLightbox();
                return;
            }

            const pinModal = document.getElementById('pin-modal');
            if (pinModal && pinModal.style.display !== 'none') {
                closePinModal(false);
                return;
            }

            closeModal();
            closeReaderModal();

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
    renderROMCards();
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
        catHtml += `<button class="filter-btn ${activeClass}" onclick="setCategory('${cat}')">${label} <span style="opacity: 0.75; font-size: 0.78rem; margin-left: 4px;">(${count})</span></button>`;
    });

    filterContainer.innerHTML = catHtml;
}

function setCategory(cat) {
    if (currentCategory === cat) return;
    currentCategory = cat;
    renderCategoryFilters();
    renderROMCards();
}

// Render ROM Cards
function renderROMCards() {
    const container = document.getElementById('cards-container');
    const counterEl = document.getElementById('results-counter');
    if (!container) return;

    if (!window.romData || !Array.isArray(window.romData)) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 30px; background: rgba(244, 63, 94, 0.1); border: 1px dashed var(--danger); border-radius: 12px; text-align: center;">
                <h3 style="color: var(--danger); font-family: var(--font-display); margin-bottom: 8px;">Failed to load ROM data</h3>
                <p style="color: var(--text-secondary);">Device datasets could not be loaded.</p>
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

    if (counterEl) {
        counterEl.textContent = `Showing ${filteredData.length} ROM${filteredData.length === 1 ? '' : 's'}`;
    }

    // Empty state
    if (filteredData.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="width: 56px; height: 56px; margin: 0 auto 16px auto; border-radius: 50%; background: var(--surface-card); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <h3 style="font-family: var(--font-display); font-size: 1.3rem; color: var(--text); margin-bottom: 6px;">No matching ROMs found</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 400px; margin: 0 auto 18px auto;">
                    ${currentSearchQuery ? `No builds match "${currentSearchQuery}".` : 'No items match your active filters.'}
                </p>
                <button class="btn-dl secondary" onclick="resetSearchAndFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    // Grouping cards
    let htmlContent = "";

    const shapePaths = [
        // flower
        "M50.0,4.0 L52.37,4.7 L54.55,6.67 L56.4,9.59 L57.87,12.96 L59.05,16.23 L60.1,18.91 L61.27,20.65 L62.79,21.28 L64.84,20.88 L67.48,19.72 L70.63,18.24 L74.05,16.9 L77.42,16.14 L80.35,16.29 L82.53,17.47 L83.71,19.65 L83.86,22.58 L83.1,25.95 L81.76,29.37 L80.28,32.52 L79.12,35.16 L78.72,37.21 L79.35,38.73 L81.09,39.9 L83.77,40.95 L87.04,42.13 L90.41,43.6 L93.33,45.45 L95.3,47.63 L96.0,50.0 L95.3,52.37 L93.33,54.55 L90.41,56.4 L87.04,57.87 L83.77,59.05 L81.09,60.1 L79.35,61.27 L78.72,62.79 L79.12,64.84 L80.28,67.48 L81.76,70.63 L83.1,74.05 L83.86,77.42 L83.71,80.35 L82.53,82.53 L80.35,83.71 L77.42,83.86 L74.05,83.1 L70.63,81.76 L67.48,80.28 L64.84,79.12 L62.79,78.72 L61.27,79.35 L60.1,81.09 L59.05,83.77 L57.87,87.04 L56.4,90.41 L54.55,93.33 L52.37,95.3 L50.0,96.0 L47.63,95.3 L45.45,93.33 L43.6,90.41 L42.13,87.04 L40.95,83.77 L39.9,81.09 L38.73,79.35 L37.21,78.72 L35.16,79.12 L32.52,80.28 L29.37,81.76 L25.95,83.1 L22.58,83.86 L19.65,83.71 L17.47,82.53 L16.29,80.35 L16.14,77.42 L16.9,74.05 L18.24,70.63 L19.72,67.48 L20.88,64.84 L21.28,62.79 L20.65,61.27 L18.91,60.1 L16.23,59.05 L12.96,57.87 L9.59,56.4 L6.67,54.55 L4.7,52.37 L4.0,50.0 L4.7,47.63 L6.67,45.45 L9.59,43.6 L12.96,42.13 L16.23,40.95 L18.91,39.9 L20.65,38.73 L21.28,37.21 L20.88,35.16 L19.72,32.52 L18.24,29.37 L16.9,25.95 L16.14,22.58 L16.29,19.65 L17.47,17.47 L19.65,16.29 L22.58,16.14 L25.95,16.9 L29.37,18.24 L32.52,19.72 L35.16,20.88 L37.21,21.28 L38.73,20.65 L39.9,18.91 L40.95,16.23 L42.13,12.96 L43.6,9.59 L45.45,6.67 L47.63,4.7 Z",
        // cookie
        "M50.0,4.0 L52.39,4.41 L54.67,5.57 L56.77,7.25 L58.69,9.13 L60.48,10.88 L62.27,12.23 L64.19,13.03 L66.34,13.3 L68.76,13.19 L71.39,12.95 L74.1,12.9 L76.68,13.28 L78.92,14.28 L80.67,15.93 L81.86,18.14 L82.53,20.71 L82.85,23.39 L83.08,25.97 L83.47,28.26 L84.26,30.22 L85.56,31.88 L87.35,33.37 L89.47,34.85 L91.63,36.47 L93.52,38.34 L94.84,40.47 L95.39,42.81 L95.14,45.26 L94.18,47.68 L92.78,50.0 L91.26,52.16 L89.95,54.2 L89.11,56.19 L88.85,58.26 L89.12,60.48 L89.74,62.91 L90.41,65.51 L90.81,68.17 L90.67,70.72 L89.84,73.0 L88.28,74.86 L86.14,76.26 L83.64,77.24 L81.05,77.96 L78.64,78.64 L76.58,79.52 L74.92,80.77 L73.61,82.5 L72.5,84.65 L71.39,87.05 L70.09,89.42 L68.46,91.46 L66.47,92.91 L64.17,93.6 L61.66,93.52 L59.1,92.82 L56.61,91.76 L54.27,90.66 L52.09,89.86 L50.0,89.56 L47.91,89.86 L45.73,90.66 L43.39,91.76 L40.9,92.82 L38.34,93.52 L35.83,93.6 L33.53,92.91 L31.54,91.46 L29.91,89.42 L28.61,87.05 L27.5,84.65 L26.39,82.5 L25.08,80.77 L23.42,79.52 L21.36,78.64 L18.95,77.96 L16.36,77.24 L13.86,76.26 L11.72,74.86 L10.16,73.0 L9.33,70.72 L9.19,68.17 L9.59,65.51 L10.26,62.91 L10.88,60.48 L11.15,58.26 L10.89,56.19 L10.05,54.2 L8.74,52.16 L7.22,50.0 L5.82,47.68 L4.86,45.26 L4.61,42.81 L5.16,40.47 L6.48,38.34 L8.37,36.47 L10.53,34.85 L12.65,33.37 L14.44,31.88 L15.74,30.22 L16.53,28.26 L16.92,25.97 L17.15,23.39 L17.47,20.71 L18.14,18.14 L19.33,15.93 L21.08,14.28 L23.32,13.28 L25.9,12.9 L28.61,12.95 L31.24,13.19 L33.66,13.3 L35.81,13.03 L37.73,12.23 L39.52,10.88 L41.31,9.13 L43.23,7.25 L45.33,5.57 L47.61,4.41 Z",
        // sunny
        "M50.0,4.0 L52.4,4.25 L54.73,5.02 L56.9,6.45 L58.26,11.12 L59.85,13.25 L61.5,14.6 L63.2,15.6 L64.99,16.34 L66.9,16.83 L69.02,17.05 L71.65,16.66 L75.92,14.32 L78.47,14.85 L80.66,15.95 L82.53,17.47 L84.05,19.34 L85.15,21.53 L85.68,24.08 L83.34,28.35 L82.95,30.98 L83.17,33.1 L83.66,35.01 L84.4,36.8 L85.4,38.5 L86.75,40.15 L88.88,41.74 L93.55,43.1 L94.98,45.27 L95.75,47.6 L96.0,50.0 L95.75,52.4 L94.98,54.73 L93.55,56.9 L88.88,58.26 L86.75,59.85 L85.4,61.5 L84.4,63.2 L83.66,64.99 L83.17,66.9 L82.95,69.02 L83.34,71.65 L85.68,75.92 L85.15,78.47 L84.05,80.66 L82.53,82.53 L80.66,84.05 L78.47,85.15 L75.92,85.68 L71.65,83.34 L69.02,82.95 L66.9,83.17 L64.99,83.66 L63.2,84.4 L61.5,85.4 L59.85,86.75 L58.26,88.88 L56.9,93.55 L54.73,94.98 L52.4,95.75 L50.0,96.0 L47.6,95.75 L45.27,94.98 L43.1,93.55 L41.74,88.88 L40.15,86.75 L38.5,85.4 L36.8,84.4 L35.01,83.66 L33.1,83.17 L30.98,82.95 L28.35,83.34 L24.08,85.68 L21.53,85.15 L19.34,84.05 L17.47,82.53 L15.95,80.66 L14.85,78.47 L14.32,75.92 L16.66,71.65 L17.05,69.02 L16.83,66.9 L16.34,64.99 L15.6,63.2 L14.6,61.5 L13.25,59.85 L11.12,58.26 L6.45,56.9 L5.02,54.73 L4.25,52.4 L4.0,50.0 L4.25,47.6 L5.02,45.27 L6.45,43.1 L11.12,41.74 L13.25,40.15 L14.6,38.5 L15.6,36.8 L16.34,35.01 L16.83,33.1 L17.05,30.98 L16.66,28.35 L14.32,24.08 L14.85,21.53 L15.95,19.34 L17.47,17.47 L19.34,15.95 L21.53,14.85 L24.08,14.32 L28.35,16.66 L30.98,17.05 L33.1,16.83 L35.01,16.34 L36.8,15.6 L38.5,14.6 L40.15,13.25 L41.74,11.12 L43.1,6.45 L45.27,5.02 L47.6,4.25 Z",
        // clover
        "M50.0,4.0 L52.4,4.26 L54.73,5.04 L56.92,6.3 L58.93,7.98 L60.72,10.01 L62.25,12.3 L63.53,14.75 L64.58,17.26 L65.42,19.74 L66.1,22.11 L66.69,24.3 L67.26,26.25 L67.87,27.93 L68.6,29.34 L69.52,30.48 L70.66,31.4 L72.07,32.13 L75.7,33.31 L77.89,33.9 L80.26,34.58 L82.74,35.42 L85.25,36.47 L87.7,37.75 L89.99,39.28 L92.02,41.07 L93.7,43.08 L94.96,45.27 L95.74,47.6 L96.0,50.0 L95.74,52.4 L94.96,54.73 L93.7,56.92 L92.02,58.93 L89.99,60.72 L87.7,62.25 L85.25,63.53 L82.74,64.58 L80.26,65.42 L77.89,66.1 L75.7,66.69 L73.75,67.26 L72.07,67.87 L70.66,68.6 L69.52,69.52 L68.6,70.66 L67.87,72.07 L67.26,73.75 L66.69,75.7 L66.1,77.89 L65.42,80.26 L64.58,82.74 L63.53,85.25 L62.25,87.7 L60.72,89.99 L58.93,92.02 L56.92,93.7 L54.73,94.96 L52.4,95.74 L50.0,96.0 L47.6,95.74 L45.27,94.96 L43.08,93.7 L41.07,92.02 L39.28,89.99 L37.75,87.7 L36.47,85.25 L35.42,82.74 L34.58,80.26 L33.9,77.89 L33.31,75.7 L32.74,73.75 L32.13,72.07 L31.4,70.66 L30.48,69.52 L29.34,68.6 L27.93,67.87 L26.25,67.26 L24.3,66.69 L22.11,66.1 L19.74,65.42 L17.26,64.58 L14.75,63.53 L12.3,62.25 L10.01,60.72 L7.98,58.93 L6.3,56.92 L5.04,54.73 L4.26,52.4 L4.0,50.0 L4.26,47.6 L5.04,45.27 L6.3,43.08 L7.98,41.07 L10.01,39.28 L12.3,37.75 L14.75,36.47 L17.26,35.42 L19.74,34.58 L22.11,33.9 L24.3,33.31 L26.25,32.74 L27.93,32.13 L29.34,31.4 L30.48,30.48 L31.4,29.34 L32.13,27.93 L32.74,26.25 L33.31,24.3 L33.9,22.11 L34.58,19.74 L35.42,17.26 L36.47,14.75 L37.75,12.3 L39.28,10.01 L41.07,7.98 L43.08,6.3 L45.27,5.04 L47.6,4.26 Z"
    ];

    htmlContent = filteredData.map((rom, idx) => {
        let badgeHtml = "";
        let displayDate = "-";
        const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
        const now = new Date();
        const isWip = !!rom.isWip;
        const isUpcoming = !isWip && build && build > now;
        const isUnlockedByYtta = isUpcoming && isYttaMode;
        const isNuked = !isWip && !isUpcoming && (!rom.downloadUrl || rom.downloadUrl.trim() === "");

        let cardAction = `onclick="viewDetail('${rom.id}')"`;
        let btnText = isUnlockedByYtta ? 'View Details (Debug)' : 'View Details';
        let btnClass = "btn-dl primary btn-card-main";
        let btnStyle = "";

        const matchCodename = (rom.device || '').match(/\(([^)]+)\)/);
        const codename = matchCodename ? matchCodename[1] : '';

        const matchAndroid = (rom.version || '').match(/(Android\s*\d+)/i);
        const androidPill = matchAndroid ? matchAndroid[1] : 'Android';

        const shapePath = shapePaths[idx % shapePaths.length];
        const emblemHtml = `
            <div class="card-emblem-badge" aria-hidden="true">
                <svg viewBox="0 0 100 100" class="card-emblem-svg">
                    <path d="${shapePath}" fill="currentColor" />
                </svg>
                <span class="card-emblem-glyph">${(rom.name || 'R').charAt(0)}</span>
            </div>
        `;

        if (isWip) {
            badgeHtml += `<span class="badge-tag wip">WIP</span>`;
            cardAction = `onclick="showWipPopup()"`;
            btnText = "Under Development";
            btnStyle = "opacity: 0.75;";
            btnClass = "btn-dl secondary btn-card-main";
            displayDate = "Work in Progress";
        } else if (isNuked) {
            badgeHtml += `<span class="badge-tag nuked">NUKED</span>`;
            cardAction = `onclick="showNukedPopup()"`;
            btnText = "Unavailable";
            btnStyle = "opacity: 0.6;";
            btnClass = "btn-dl secondary btn-card-main";
            displayDate = "Unavailable";
        } else if (isUpcoming) {
            if (isUnlockedByYtta) {
                badgeHtml += `<span class="badge-tag upcoming" style="background: var(--accent); color: #000000; font-weight: 700;">UNLOCKED</span>`;
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

        return `
        <div class="rom-card" style="--card-index: ${idx};" ${cardAction}>
            <div class="card-banner-wrapper">
                ${bannerContent}
                <div class="card-banner-overlay">
                    <div class="card-floating-badges">
                        <span class="card-device-badge">${codename || 'Device'}</span>
                        <span class="card-version-pill">${androidPill}</span>
                    </div>
                </div>
            </div>

            <div class="card-body">
                <div class="card-title-row">
                    <div class="card-title-group">
                        ${emblemHtml}
                        <h3 class="card-title" style="color: ${isNuked ? 'var(--text-muted)' : 'inherit'};">
                            ${rom.name}
                        </h3>
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                        ${badgeHtml}
                    </div>
                </div>

                <div class="card-info-list">
                    <div class="card-info-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        <span>Device: <span class="val">${rom.device}</span></span>
                    </div>
                    <div class="card-info-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="3"></rect><path d="M12 8V4.5"></path><circle cx="12" cy="2.6" r="1.4"></circle><path d="M9 13v1.6M15 13v1.6"></path></svg>
                        <span>Android: <span class="val">${rom.version}</span></span>
                    </div>
                    <div class="card-info-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>Released: <span class="val">${displayDate}</span></span>
                    </div>
                </div>

                <div class="card-actions-row">
                    <button class="${btnClass}" style="${btnStyle}" ${cardAction}>${btnText}</button>
                    <button class="btn-card-share" onclick="event.stopPropagation(); copyRomLink('${rom.id}')" title="Copy ROM link" aria-label="Copy link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = htmlContent;
}

function resetSearchAndFilters() {
    currentSearchQuery = '';
    currentDeviceFilter = 'All';
    currentCategory = 'All';
    const searchInput = document.getElementById('rom-search-input');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('search-clear-btn');
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
    copyRomLink(hash || '');
}

// Home Navigation
function navigateHome(fromHash = false) {
    updateCSS('-blue');

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
    if (existingStickyBar) {
        existingStickyBar.style.display = 'none';
        existingStickyBar.innerHTML = '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderCategoryFilters();
    renderDeviceFilterChips();
    renderROMCards();
}

// 404 Error Page
function show404() {
    updateCSS('-blue');
    document.body.classList.remove('has-sticky-bar');
    const existingStickyBar = document.getElementById('mobile-sticky-bar');
    if (existingStickyBar) {
        existingStickyBar.style.display = 'none';
        existingStickyBar.innerHTML = '';
    }

    const detailContent = document.getElementById('detail-content');
    if (detailContent) {
        detailContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h1 style="font-family: var(--font-display); font-size: 6rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 10px;">404</h1>
                <h2 style="font-family: var(--font-display); font-size: 1.8rem; color: var(--text); margin-bottom: 12px;">Build Not Found</h2>
                <p style="color: var(--text-secondary); font-size: 1rem; max-width: 480px; margin-bottom: 30px; line-height: 1.6;">
                    The ROM build you are searching for does not exist or has been relocated.
                </p>
                <button class="btn-dl primary" onclick="navigateHome()" style="padding: 12px 28px;">
                    Back to All ROMs
                </button>
            </div>
        `;
    }

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
}

// Popups & Dialogs
function showUpcomingPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box warning">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h2 class="modal-popup-title warning">Stay Tuned!</h2>
            <p class="modal-popup-text">
                This build is actively in development. Direct downloads will be posted as soon as testing completes.
            </p>
            <div class="modal-actions-row">
                <button class="btn-dl primary" onclick="closeModal()">Got it</button>
            </div>
        </div>
    `;
    openModal(modal);
}

function showNukedPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box danger">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </div>
            <h2 class="modal-popup-title danger">Build Withdrawn</h2>
            <p class="modal-popup-text">
                This ROM build has been deprecated or nuked due to newer releases or critical issues. Details and files are no longer accessible.
            </p>
            <div class="modal-actions-row">
                <button class="btn-dl primary danger-btn" onclick="closeModal()">Understood</button>
            </div>
        </div>
    `;
    openModal(modal);
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
    openModal(modal);
}

function showDownloadWarningPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
        <div class="modal-popup-container">
            <div class="modal-popup-icon-box danger">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 class="modal-popup-title danger">Important Flashing Notice</h2>

            <div class="modal-popup-notice">
                <strong class="modal-popup-notice-title">Your warranty is now void.</strong>
                <p>We are not responsible for bricked devices, dead SD cards, or thermonuclear war. Please verify instructions carefully before flashing! You choose to install this at your own discretion.</p>
            </div>

            <div class="modal-actions-row">
                <button class="btn-dl primary danger-btn" onclick="proceedDownload()">Proceed to Download</button>
                <button class="btn-dl secondary" onclick="copyActiveDownloadUrl()">Copy Link</button>
                <button class="btn-dl secondary" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;

    openModal(modal);
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

// Markdown Parser & Processor
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

function enhanceMarkdownBlocks(container) {
    if (!container) return;

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

// View Detail Page
function viewDetail(id) {
    if (isEggTriggered) return;

    // Easter egg spam detection
    if (id === lastOpenedRomId) {
        spamCount++;
    } else {
        spamCount = 1;
        lastOpenedRomId = id;
    }

    clearTimeout(spamTimeout);
    spamTimeout = setTimeout(() => {
        spamCount = 0;
        lastOpenedRomId = null;
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
        if (window.location.hash) {
            history.replaceState("", document.title, window.location.pathname + window.location.search);
        }
        return;
    }

    // Apply accent theme
    updateCSS(rom.cssSuffix || '-blue');

    const build = rom.buildDate ? getGMT8Target(rom.buildDate) : null;
    const now = new Date();
    const isUpcoming = build && build > now;
    const isUnlockedByYtta = isUpcoming && isYttaMode;
    const isNuked = !isUpcoming && (!rom.downloadUrl || rom.downloadUrl.trim() === "");

    if (isNuked) {
        showNukedPopup();
        if (window.location.hash) {
            history.replaceState("", document.title, window.location.pathname + window.location.search);
        }
        return;
    }

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
        displayDate = isUnlockedByYtta ? `${formattedReleaseDate} (Upcoming Preview)` : (isUpcoming ? "Coming soon" : formattedReleaseDate);
    }

    let descHtml = parseMarkdown(rom.description);
    let notesHtml = parseMarkdown(rom.notes);
    let flashHtml = parseMarkdown(rom.flashInstruction);
    let creditsHtml = parseMarkdown(rom.credits);

    currentLightboxImages = Array.isArray(rom.screenshots) ? rom.screenshots : [];

    let screenshotsHtml = "";
    if (currentLightboxImages.length > 0) {
        screenshotsHtml = `
            <div class="screenshot-hint-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                <span>Click screenshot for fullscreen view</span>
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
        screenshotsHtml = "<p style='color: var(--text-muted); font-style: italic; margin-top: 16px;'>No screenshots available for this build.</p>";
    }

    let personalWarningHtml = "";
    if (rom.isPersonal) {
        personalWarningHtml = `
            <div style="background: var(--surface-card); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 16px 20px; margin: 15px 0 25px 0; border-radius: var(--radius-sm);">
                <h3 style="color: var(--accent); font-family: var(--font-display); font-size: 1.1rem; margin-top: 0; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                    ⚠️ Personal Build
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0; line-height: 1.6;">
                    This build is compiled specifically for personal daily driving. It may include custom configs or experimental adjustments. Flash at your own risk.
                </p>
            </div>
        `;
    }

    let downloadButtonHtml = (isUpcoming && !isUnlockedByYtta)
        ? `<button class="btn-dl secondary" onclick="showUpcomingPopup()" style="border-color: var(--accent);">Coming Soon</button>`
        : `<button class="btn-dl primary" onclick="showDownloadWarningPopup()">${isUnlockedByYtta ? 'Download ROM (Debug Unlocked)' : 'Download ROM'}</button>`;

    let bannerBadgeHtml = isUpcoming
        ? (isUnlockedByYtta ? '<span class="badge-tag upcoming" style="background: var(--accent); color: #000; font-weight: 700; margin-bottom: 10px;">UNLOCKED PREVIEW</span>' : '<span class="badge-tag upcoming" style="margin-bottom: 10px;">UPCOMING</span>')
        : '<span class="badge-tag new" style="margin-bottom: 10px;">STABLE</span>';

    let tabDescBadgeHtml = '';
    if (isUpcoming) {
        tabDescBadgeHtml = isUnlockedByYtta 
            ? `<span class="tab-badge-unlocked">Unlocked</span>`
            : `<span class="tab-badge-locked">Locked</span>`;
    }

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <div class="rom-detail-banner" style="background-image: url('${rom.banner}');">
            <div class="rom-banner-content">
                ${bannerBadgeHtml}
                <h1 class="rom-banner-title">${rom.name}</h1>
            </div>
        </div>

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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="3"></rect><path d="M12 8V4.5"></path><circle cx="12" cy="2.6" r="1.4"></circle><path d="M9 13v1.6M15 13v1.6"></path></svg>
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
            <button class="tab-btn active" onclick="switchTab('desc')"><span class="tab-label-long">Changelog &amp; Notes</span><span class="tab-label-short">Changelog</span> ${tabDescBadgeHtml}</button>
            <button class="tab-btn" onclick="switchTab('flash')"><span class="tab-label-long">Flashing Steps</span><span class="tab-label-short">Flashing</span></button>
            <button class="tab-btn" onclick="switchTab('screens')"><span class="tab-label-long">Screenshots (${currentLightboxImages.length})</span><span class="tab-label-short">Shots (${currentLightboxImages.length})</span></button>
        </div>

        <div class="rom-description-container">
            <div id="tab-desc" class="tab-content active">
                ${(isUpcoming && !isUnlockedByYtta) ? `
                    <div class="upcoming-desc-wrapper">
                        <div class="upcoming-desc-body is-blurred">
                            ${descHtml}
                            ${notesHtml ? `<div style="margin-top: 25px;"><h3 style="color: var(--accent); margin-bottom: 12px;">Important Notes</h3>${notesHtml}</div>` : ''}
                            <div style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
                                <h3 style="color: var(--accent); margin-bottom: 12px;">Credits & Acknowledgements</h3>
                                ${creditsHtml}
                            </div>
                        </div>

                        <div class="upcoming-sensor-overlay">
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
                                <h3 class="upcoming-sensor-title">Changelog Locked</h3>
                                <p class="upcoming-sensor-text">
                                    This build is actively in development. Changelog and specifications are confidential until public release.
                                </p>
                                <div class="upcoming-sensor-callout">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
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
                                    <div style="font-weight: 700; font-size: 0.92rem; color: var(--accent); font-family: var(--font-display);">Debug Mode Active</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Pre-release specifications, changelog, and build preview unlocked for testing.</div>
                                </div>
                            </div>
                            <button class="ytta-exit-btn" onclick="exitYttaMode()">Exit Debug</button>
                        </div>
                    ` : ''}

                    ${descHtml}

                    ${notesHtml ? `
                        <div style="margin-top: 25px;">
                            <h3 style="color: var(--accent); margin-bottom: 12px;">Important Notes</h3>
                            ${notesHtml}
                        </div>
                    ` : ''}

                    <div style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
                        <h3 style="color: var(--accent); margin-bottom: 12px;">Credits & Acknowledgements</h3>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Copy Link
            </button>
        </div>
    `;

    enhanceMarkdownBlocks(detailContent);

    // Update root-level Mobile Sticky Bar
    const stickyBar = document.getElementById('mobile-sticky-bar');
    if (stickyBar) {
        stickyBar.innerHTML = `
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
        `;
        stickyBar.style.display = 'flex';
    }

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
    document.body.classList.add('has-sticky-bar');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Lightbox Functions
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
        }, 100);
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
        }, 100);
    }
    if (counter) {
        counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    }
}

// Lightbox Touch Gestures
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

        if (absX > 40 && absX > absY) {
            if (diffX < 0) {
                nextLightboxImage();
            } else {
                prevLightboxImage();
            }
        } else if (diffY > 75 && absY > absX) {
            closeLightbox();
        }
    }, { passive: true });
}

// Scroll to Top
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

    // Keep the floating button from covering the footer's text on phones.
    // The class is toggled unconditionally; the CSS that acts on it lives
    // inside a max-width media query, so this is inert on larger screens.
    const footer = document.querySelector('footer');
    if (footer) {
        const updateNearFooter = () => {
            const rect = footer.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            document.body.classList.toggle('is-near-footer', inView);
        };
        window.addEventListener('scroll', updateNearFooter, { passive: true });
        window.addEventListener('resize', updateNearFooter);
        updateNearFooter();
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
        viewDetail(romId);
    } else {
        isSecretMode = false;
        navigateHome(false);
    }
}

window.addEventListener('hashchange', handleRouting);

// Modal Helpers
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('closing');
    modal.style.display = 'flex';
    void modal.offsetWidth; // Force CSS animation restart
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const mdModal = document.getElementById('md-modal');
    if (mdModal) {
        mdModal.classList.add('closing');
        mdModal.classList.remove('active');
        setTimeout(() => {
            if (mdModal.classList.contains('closing')) {
                mdModal.style.display = 'none';
                mdModal.classList.remove('closing');
            }
        }, 220);
    }
    document.body.style.overflow = '';
}

function closeReaderModal() {
    const readerModal = document.getElementById('reader-modal');
    if (readerModal) {
        readerModal.classList.add('closing');
        readerModal.classList.remove('active');
        setTimeout(() => {
            if (readerModal.classList.contains('closing')) {
                readerModal.style.display = 'none';
                readerModal.classList.remove('closing');
            }
        }, 220);
    }
    document.body.style.overflow = '';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'pin-modal') {
            closePinModal(false);
        } else if (event.target.id === 'reader-modal') {
            closeReaderModal();
        } else {
            closeModal();
        }
    }
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeReaderModal();
        closePinModal(false);
    }
});

// Announcement Banner Loader
async function loadAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    const textContainer = document.getElementById('announcement-text');
    const closeBtn = document.getElementById('close-banner');

    if (!banner || !textContainer || !closeBtn) return;

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
                    let parsedMessage = (window.marked && typeof window.marked.parse === 'function')
                        ? window.marked.parse(msg)
                        : msg.replace(/\n/g, '<br>');
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
                        // Only show expand button if content actually overflows and is clipped
                        if (bannerTextContainer.scrollHeight > bannerTextContainer.clientHeight + 6) {
                            expandBtn.style.display = 'block';
                            expandBtn.onclick = () => {
                                bannerTextContainer.classList.toggle('expanded');
                                expandBtn.textContent = bannerTextContainer.classList.contains('expanded') ? 'View less' : 'View more';
                            };
                        } else {
                            expandBtn.style.display = 'none';
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
