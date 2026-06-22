let currentFilter = 'All';

document.addEventListener("DOMContentLoaded", () => {

    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const cssLink = document.querySelector('link[href*="style.css"]') || document.querySelector('link[href*="style-sakura.css"]');

    if (cssLink) {
        if (date >= 22 && month === 6 && year === 2026) {
            if (!cssLink.href.includes('style-sakura.css')) {
                cssLink.href = 'assets/css/style-sakura.css?v=1';
                createLeaves();
            }
        } else {
            if (cssLink.href.includes('style-sakura.css')) {
                cssLink.href = 'assets/css/style.css?v=19';
            }
        }
    }
    window.romData = [];
    if (window.fogData) window.romData = window.romData.concat(window.fogData);
    if (window.earthData) window.romData = window.romData.concat(window.earthData);
    if (window.galeData) window.romData = window.romData.concat(window.galeData);

    const currentYearStr = new Date().getFullYear();
    if (document.getElementById('footer-year')) document.getElementById('footer-year').textContent = currentYearStr;
    document.querySelectorAll('.footer-year-d').forEach(el => el.textContent = currentYearStr);

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
    loadAnnouncement();
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

    let filteredData = [...window.romData];

    filteredData.sort((a, b) => {
        const dateA = a.buildDate ? new Date(a.buildDate).getTime() : 0;
        const dateB = b.buildDate ? new Date(b.buildDate).getTime() : 0;
        return dateB - dateA;
    });

    if (currentFilter !== 'All') {
        filteredData = filteredData.filter(rom => rom.device === currentFilter);
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
                today.setHours(0, 0, 0, 0);
                const build = new Date(rom.buildDate);
                build.setHours(0, 0, 0, 0);

                if (build > today) {
                    badgeHtml = `<span class="new-badge">UPCOMING</span>`;
                } else {
                    const diffTime = today - build;
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays <= 14) {
                        badgeHtml = `<span class="new-badge">NEW</span>`;
                    }
                }

                displayDate = build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }

            return `
            <div class="rom-card glass" onclick="viewDetail('${rom.id}')">
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

    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) {
        detailContainer.style.background = '';
    }

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) {
        backBtn.style.display = '';
    }

    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-home').classList.add('active');
}

function show404() {
    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) {
        detailContainer.style.background = 'transparent';
    }

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) {
        backBtn.style.display = 'none';
    }

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

function showUpcomingPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
    <div style="text-align: center; padding: 10px;">
    <h2 style="font-family: 'Syne', sans-serif; font-size: 1.8rem; color: var(--accent); margin-bottom: 15px;">Stay Tuned!</h2>
    <p style="color: var(--text); font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
    This ROM is still in the development stage (Upcoming), and a download link is not yet available. Stay tuned for further updates!
    </p>
    <button class="btn-dl primary" onclick="closeModal()">Understand</button>
    </div>
    `;
    modal.style.display = 'flex';
}

function viewDetail(id) {
    const rom = window.romData.find(r => String(r.id) === String(id));

    if (!rom) {
        show404();
        return;
    }

    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) {
        detailContainer.style.background = '';
    }

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) {
        backBtn.style.display = '';
    }

    activeDownloadUrl = rom.downloadUrl;

    window.location.hash = id;

    let isUpcoming = false;
    if (rom.buildDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const build = new Date(rom.buildDate);
        build.setHours(0, 0, 0, 0);
        isUpcoming = build > today;
    }

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

    let downloadButtonHtml = isUpcoming
    ? `<button class="btn-dl secondary" onclick="showUpcomingPopup()" style="padding: 16px 32px; border-color: var(--accent);">Coming Soon</button>`
    : `<button class="btn-dl primary" onclick="window.open(activeDownloadUrl, '_blank')" style="padding: 16px 32px;">Download ROM</button>`;

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
    ${downloadButtonHtml}
    </div>
    </div>
    `;

    document.getElementById('page-home').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
}

function handleRouting() {
    const hash = window.location.hash;

    if (hash) {
        const romId = decodeURIComponent(hash.substring(1));
        viewDetail(romId);
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

function createLeaves() {
    let container = document.getElementById('leaf-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'leaf-container';
        document.body.prepend(container);
    }

    const leafCount = 20;

    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');

        const size = Math.random() * 30 + 20;
        const leftPos = Math.random() * 100;
        const fallDuration = Math.random() * 10 + 10;
        const swayDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 100;
        const opacity = Math.random() * 0.25 + 0.1;

        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.left = `${leftPos}vw`;
        leaf.style.opacity = opacity;
        leaf.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;

        leaf.style.animationDelay = `-${delay}s, -${delay}s`;

        container.appendChild(leaf);
    }
}

async function loadAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    const textContainer = document.getElementById('announcement-text');
    const closeBtn = document.getElementById('close-banner');

    if (!banner || !textContainer || !closeBtn) return;

    try {
        const response = await fetch('assets/announcement.txt?t=' + new Date().getTime());

        if (response.ok) {
            const text = await response.text();

            const announcement = text.trim().replace(/\n/g, '<br>');

            if (announcement.length > 0) {
                const hiddenAnnouncement = localStorage.getItem('hiddenAnnouncement');

                if (hiddenAnnouncement !== announcement) {

                    textContainer.innerHTML = announcement;
                    banner.classList.remove('hidden');

                    closeBtn.onclick = () => {
                        banner.classList.add('hidden');

                        localStorage.setItem('hiddenAnnouncement', announcement);
                    };
                }
            }
        }
    } catch (error) {

        console.log("No announcement");
    }
}



window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
