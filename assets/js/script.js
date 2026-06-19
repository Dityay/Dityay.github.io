let currentFilter = 'All';

document.addEventListener("DOMContentLoaded", () => {
    window.romData = [];
    if (window.fogData) window.romData = window.romData.concat(window.fogData);
    if (window.earthData) window.romData = window.romData.concat(window.earthData);
    if (window.galeData) window.romData = window.romData.concat(window.galeData);

    const year = new Date().getFullYear();
    if (document.getElementById('footer-year')) document.getElementById('footer-year').textContent = year;
    document.querySelectorAll('.footer-year-d').forEach(el => el.textContent = year);

    const htmlElement = document.documentElement;
    const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

    function applySystemTheme(e) {
        if (e.matches) {
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            htmlElement.setAttribute('data-theme', 'light');
        }
    }

    applySystemTheme(systemThemeMedia);
    systemThemeMedia.addEventListener('change', applySystemTheme);

    renderDeviceFilters();
    renderROMCards();
    handleRouting();
});

function renderDeviceFilters() {
    const filterContainer = document.getElementById('home-device-filter-container');
    if (!filterContainer || !window.romData) return;

    const devices = [...new Set(window.romData.map(rom => rom.device))];

    let filterHtml = `<button class="filter-btn ${currentFilter === 'All' ? 'active' : ''}" onclick="setFilter('All')">All Devices</button>`;

    devices.forEach(device => {
        let shortName = device;
        const match = device.match(/\(([^)]+)\)/);
    if (match) {
        shortName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    filterHtml += `<button class="filter-btn ${currentFilter === device ? 'active' : ''}" onclick="setFilter('${device}')">${shortName}</button>`;
    });

    filterContainer.innerHTML = filterHtml;
}

function setFilter(device) {
    currentFilter = device;
    renderDeviceFilters();
    renderROMCards();
}

function renderROMCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    if (!window.romData || !Array.isArray(window.romData)) {
        container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 20px; background: rgba(255, 107, 107, 0.1); border: 2px dashed #ff6b6b; border-radius: 16px; text-align: center;">
        <h3 style="color: #ff6b6b; font-family: 'Syne', sans-serif; margin-bottom: 10px;">⚠️ Data ROM Gagal Dimuat</h3>
        <p style="color: var(--text);">Cek file data JS kamu. Pastikan strukturnya benar.</p>
        </div>
        `;
        return;
    }

    let filteredData = window.romData;
    if (currentFilter !== 'All') {
        filteredData = window.romData.filter(rom => rom.device === currentFilter);
    }

    const devicesToRender = currentFilter === 'All'
    ? [...new Set(filteredData.map(rom => rom.device))]
    : [currentFilter];

    let htmlContent = "";

    devicesToRender.forEach((device, index) => {
        const marginTop = index === 0 ? "0px" : "40px";

        htmlContent += `
        <div style="grid-column: 1 / -1; margin-top: ${marginTop}; margin-bottom: 10px; border-bottom: 2px solid var(--border); padding-bottom: 12px;">
        <h2 style="font-family: 'Syne', sans-serif; font-size: 1.6rem; color: var(--accent); display: flex; align-items: center; gap: 10px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
        ${device}
        </h2>
        </div>
        `;

        const deviceRoms = filteredData.filter(rom => rom.device === device);

        htmlContent += deviceRoms.map(rom => {
            let badgeHtml = "";
            let displayDate = "-";

            if (rom.buildDate) {
                const today = new Date();
                const build = new Date(rom.buildDate);
                const diffTime = today - build;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 14) {
                    badgeHtml = `<span class="new-badge">NEW</span>`;
                }
                displayDate = build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }

            return `
            <div class="rom-card glass" onclick="viewDetail(${rom.id})">
            <h3 style="font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; color: var(--accent); letter-spacing: -0.5px; line-height: 1.2;">
            ${rom.name} ${badgeHtml}
            </h3>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Device: <span style="color: var(--text); font-weight: 500;">${rom.device}</span></p>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Version: <span style="color: var(--text); font-weight: 500;">${rom.version}</span></p>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 24px;">Build Date: <span style="color: var(--text); font-weight: 500;">${displayDate}</span></p>
            <button class="btn-dl primary" style="width: 100%; margin-top: auto;">Get ROM</button>
            </div>
            `;
        }).join('');
    });

    if (filteredData.length === 0) {
        htmlContent = `<div style="grid-column: 1 / -1; color: var(--muted); text-align: center; padding: 40px 0;">No ROMs found for this device.</div>`;
    }

    container.innerHTML = htmlContent;
}

function navigateHome() {
    if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-home').classList.add('active');
}

let activeDownloadUrl = "";

function show404() {
    document.getElementById('detail-content').innerHTML = `
    <div style="text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <h1 style="font-family: 'Syne', sans-serif; font-size: 8rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 10px;">404</h1>
    <h2 style="font-family: 'Syne', sans-serif; font-size: 2rem; color: var(--text); margin-bottom: 16px;">Oops! You're Lost</h2>
    <p style="color: var(--muted); font-size: 1.1rem; max-width: 500px; margin-bottom: 40px; line-height: 1.6;">
    The ROM or page you are looking for doesn't exist, has been removed, or the link is broken.
    </p>
    <button class="btn-dl primary" onclick="navigateHome()" style="padding: 16px 32px; font-size: 1.1rem;">
    Back to Home
    </button>
    </div>
    `;
    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
}

function viewDetail(id) {
    const rom = window.romData.find(r => r.id === id);

    if (!rom) {
        show404();
        return;
    }

    activeDownloadUrl = rom.downloadUrl;
    window.location.hash = `rom-${id}`;

    let markdownText = rom.description || "No description available.";
    markdownText = markdownText.replace(/^[ \t]+/gm, '');
    markdownText = markdownText.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1<a href="https://t.me/$2" target="_blank" class="rom-link">@$2</a>');

    let parsedDescriptionHtml = "";
    try {
        if (window.marked && window.marked.parse) {
            parsedDescriptionHtml = window.marked.parse(markdownText);
        } else if (typeof window.marked === 'function') {
            parsedDescriptionHtml = window.marked(markdownText);
        } else {
            parsedDescriptionHtml = markdownText.replace(/\n/g, '<br>');
        }
    } catch (e) {
        console.error("Marked parse error:", e);
        parsedDescriptionHtml = markdownText.replace(/\n/g, '<br>');
    }

    let screenshotsHtml = "";
    if (rom.screenshots && rom.screenshots.length > 0) {
        screenshotsHtml = `
        <div class="screenshot-section">
        <h2 class="screenshot-title">Screenshots</h2>
        <div class="screenshot-grid">
        ${rom.screenshots.map(src => `<img src="${src}" class="screenshot-item" alt="Screenshot" onclick="openImageModal('${src}')">`).join('')}
        </div>
        </div>
        `;
    }

    document.getElementById('detail-content').innerHTML = `
    <div class="rom-detail-banner" style="background-image: url('${rom.banner}');">
    <div class="rom-banner-content">
    <h1 class="rom-banner-title">${rom.name}</h1>
    </div>
    </div>
    <div style="padding: 10px 5px;">
    <p style="font-size: 1.1rem; color: var(--text); margin-bottom: 8px;">
    Device: <span style="color: var(--accent); font-weight: 700;">${rom.device}</span>
    </p>
    <p style="font-size: 1rem; color: var(--muted); margin-bottom: 25px;">
    Version: <span style="color: var(--text); font-weight: 600;">${rom.version}</span>
    </p>
    <div class="rom-description-container">
    ${parsedDescriptionHtml}
    </div>
    ${screenshotsHtml}
    <div style="margin-top: 35px;">
    <button class="btn-dl primary" onclick="window.open(activeDownloadUrl, '_blank')" style="padding: 16px 32px;">
    Download ROM
    </button>
    </div>
    </div>
    `;

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
}

function handleRouting() {
    const hash = window.location.hash;

    if (hash) {
        if (hash.startsWith('#rom-')) {
            const romId = parseInt(hash.replace('#rom-', ''));
            viewDetail(romId);
        } else {
            show404();
        }
    } else {
        navigateHome();
    }
}

function openImageModal(imgSrc) {
    const modal = document.getElementById('reader-modal');
    const title = document.getElementById('reader-title');
    const content = document.getElementById('reader-content');

    title.textContent = "Screenshot Preview";
    content.innerHTML = `<img src="${imgSrc}" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 16px;" alt="Preview">`;
    modal.style.display = 'flex';
}

function closeReaderModal() {
    document.getElementById('reader-modal').style.display = 'none';
}

function closeModal() {
    const mdModal = document.getElementById('md-modal');
    if (mdModal) mdModal.style.display = 'none';
}

window.addEventListener('hashchange', () => {
    handleRouting();
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
