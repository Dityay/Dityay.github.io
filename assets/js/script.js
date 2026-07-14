let currentFilter = 'All';
let activeDownloadUrl = '';
let isSecretMode = false;
let leavesCreated = false;

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

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

    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        navLogo.removeAttribute('onclick');
        navLogo.addEventListener('click', () => {
            isSecretMode = false;
            window.location.hash = '';
            navigateHome();
        });
    }

    createLeaves();
    renderDeviceFilters();
    renderROMCards();
    loadAnnouncement();
    handleRouting();
});

function renderDeviceFilters() {
    const filterContainer = document.getElementById('home-device-filter-container');
    if (!filterContainer || !window.romData) return;

    let visibleData = window.romData;

    if (isSecretMode) {
        visibleData = visibleData.filter(rom => rom.isPersonal);
    } else {
        visibleData = visibleData.filter(rom => !rom.isPersonal);
    }

    const devices = [...new Set(visibleData.map(rom => rom.device))];

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
        <h3 style="color: #ff6b6b; font-family: 'Syne', sans-serif; margin-bottom: 10px;">⚠️ Failed to load ROM data.</h3>
        <p style="color: var(--text);">Make sure your JS data format is correct.</p>
        </div>
        `;
        return;
    }

    let filteredData = [...window.romData];

    if (isSecretMode) {
        filteredData = filteredData.filter(rom => rom.isPersonal);
    } else {
        filteredData = filteredData.filter(rom => !rom.isPersonal);
    }

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

            const isNuked = !rom.downloadUrl || rom.downloadUrl.trim() === "";

            let cardAction = `onclick="viewDetail('${rom.id}')"`;
            let cursorStyle = "cursor: pointer;";
            let imgFilter = "";
            let btnText = "Get ROM";
            let btnStyle = "width: 100%; margin-top: auto;";
            let btnClass = "btn-dl primary";

            if (isNuked) {
                badgeHtml = `<span class="new-badge" style="background-color: #4a3e36; color: #b0a69d; text-decoration: line-through;">NUKED</span>`;
                cardAction = "";
                cursorStyle = "cursor: not-allowed;";
                imgFilter = "filter: grayscale(100%) opacity(0.6);";
                btnText = "Unavailable";
                btnStyle = "width: 100%; margin-top: auto; opacity: 0.5; pointer-events: none;";
                btnClass = "btn-dl secondary";
            } else if (rom.buildDate) {
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
            }

            if (rom.isPersonal) {
                badgeHtml += `<span class="new-badge" style="background-color: var(--muted); color: #fff;">PERSONAL</span>`;
            }

            if (rom.buildDate) {
                const build = new Date(rom.buildDate);
                displayDate = build.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }

            return `
            <div class="rom-card glass" ${cardAction} style="padding: 0; ${cursorStyle}">
            <div style="width: 100%; height: 160px; background-image: url('${rom.banner}'); background-size: cover; background-position: center; border-radius: var(--radius-m3) var(--radius-m3) 0 0; position: relative; ${imgFilter}">
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to top, var(--surface-cards), transparent);"></div>
            </div>

            <div style="padding: 24px; display: flex; flex-direction: column; flex-grow: 1;">
            <h3 style="font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; color: ${isNuked ? 'var(--muted)' : 'var(--accent)'}; letter-spacing: -0.5px; line-height: 1.2;">
            ${rom.name} ${badgeHtml}
            </h3>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Device: <span style="color: var(--text); font-weight: 500;">${rom.device}</span></p>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Version: <span style="color: var(--text); font-weight: 500;">${rom.version}</span></p>
            <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 24px;">Build Date: <span style="color: var(--text); font-weight: 500;">${displayDate}</span></p>
            <button class="${btnClass}" style="${btnStyle}">${btnText}</button>
            </div>
            </div>
            `;
        }).join('');
    });

    if (filteredData.length === 0) {
        htmlContent = `<div style="grid-column: 1 / -1; color: var(--muted); text-align: center; padding: 40px 0;">No ROMs found for this category.</div>`;
    }

    container.innerHTML = htmlContent;
}

function navigateHome(fromHash = false) {
    if (!fromHash) {
        if (isSecretMode) {
            window.location.hash = 'personal';
            return;
        }
        if (window.location.hash) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    }

    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) detailContainer.style.background = '';

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) backBtn.style.display = '';

    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-home').classList.add('active');

    renderDeviceFilters();
    renderROMCards();
}

function show404() {
    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) detailContainer.style.background = 'transparent';

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) backBtn.style.display = 'none';

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

function showNukedPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
    <div style="text-align: center; padding: 10px;">
    <h2 style="font-family: 'Syne', sans-serif; font-size: 1.8rem; color: #ff6b6b; margin-bottom: 15px;">⛔ NUKED</h2>
    <p style="color: var(--text); font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
    This ROM has been nuked (withdrawn/removed) and its details are no longer accessible.
    </p>
    <button class="btn-dl primary" onclick="closeModal()">Understand</button>
    </div>
    `;
    modal.style.display = 'flex';
}

function showDownloadWarningPopup() {
    const modal = document.getElementById('md-modal');
    const content = document.getElementById('md-content');

    content.innerHTML = `
    <div style="text-align: center; padding: 10px;">
    <h2 style="font-family: 'Syne', sans-serif; font-size: 1.6rem; color: #ff6b6b; margin-bottom: 15px;">
    ⚠️ Warning
    </h2>

    <div style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px; background: var(--surface); padding: 18px; border-radius: 16px; border: 1px solid var(--border); text-align: left;">
    <strong style="color: #ff6b6b; font-size: 1.05rem; display: block; margin-bottom: 8px;">
    Your warranty is now void.
    </strong>
    <p style="margin: 0; color: var(--muted);">
    We are not responsible for bricked devices, dead SD cards, thermonuclear war, or you getting fired because the alarm app failed. Please do some research if you have any concerns about features included in this ROM before flashing it! YOU are choosing to make these modifications, and if you point the finger at us for messing up your device, we will laugh at you.
    </p>
    </div>

    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
    <button class="btn-dl secondary" onclick="closeModal()">Cancel</button>
    <button class="btn-dl primary" onclick="proceedDownload()">I Understand</button>
    </div>
    </div>
    `;

    modal.style.display = 'flex';
}

function proceedDownload() {
    closeModal();
    if (activeDownloadUrl) {
        window.open(activeDownloadUrl, '_blank');
    }
}

function parseMarkdown(text) {
    if (!text) return "";
    let safeText = text.replace(/^[ \t]+/gm, '');
    safeText = safeText.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1<a href="https://t.me/$2" target="_blank" class="rom-link">@$2</a>');

    try {
        if (window.marked && window.marked.parse) {
            return window.marked.parse(safeText);
        } else if (typeof window.marked === 'function') {
            return window.marked(safeText);
        } else {
            return safeText.replace(/\n/g, '<br>');
        }
    } catch (e) {
        console.error("Marked parse error:", e);
        return safeText.replace(/\n/g, '<br>');
    }
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
};

function viewDetail(id) {
    const rom = window.romData.find(r => String(r.id) === String(id));

    if (!rom) {
        show404();
        return;
    }

    const isNuked = !rom.downloadUrl || rom.downloadUrl.trim() === "";
    if (isNuked) {
        showNukedPopup();

        window.location.hash = isSecretMode ? 'personal' : '';
        return;
    }

    const detailContainer = document.querySelector('.detail-container');
    if (detailContainer) detailContainer.style.background = '';

    const backBtn = document.querySelector('.detail-container .back-btn');
    if (backBtn) backBtn.style.display = '';

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

    let descHtml = parseMarkdown(rom.description);
    let notesHtml = parseMarkdown(rom.notes);
    let flashHtml = parseMarkdown(rom.flashInstruction);
    let creditsHtml = parseMarkdown(rom.credits);

    let screenshotsHtml = "";
    if (rom.screenshots && rom.screenshots.length > 0) {
        screenshotsHtml = `
        <div class="screenshot-grid" style="margin-top: 20px;">
        ${rom.screenshots.map(src => `<img src="${src}" class="screenshot-item" alt="Screenshot" onclick="openImageModal('${src}')">`).join('')}
        </div>
        `;
    } else {
        screenshotsHtml = "<p style='color: var(--muted); font-style: italic; margin-top: 20px;'>No screenshots available.</p>";
    }

    let personalWarningHtml = "";
    if (rom.isPersonal) {
        personalWarningHtml = `
        <div style="background: var(--surface-highest); border-left: 4px solid var(--accent); padding: 16px 20px; margin: 10px 5px 25px 5px; border-radius: 0 12px 12px 0;">
        <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.2rem; margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        ⚠️ Personal Build
        </h3>
        <p style="color: var(--muted); font-size: 0.95rem; margin: 0; line-height: 1.6;">
        This ROM is specifically compiled for personal use. It might contain experimental features, missing optimizations, or specific configurations tailored for the developer. You are free to download and flash it, but please proceed with caution.
        </p>
        </div>
        `;
    }

    let downloadButtonHtml = isUpcoming
    ? `<button class="btn-dl secondary" onclick="showUpcomingPopup()" style="padding: 16px 32px; border-color: var(--accent);">Coming Soon</button>`
    : `<button class="btn-dl primary" onclick="showDownloadWarningPopup()" style="padding: 16px 32px;">Download ROM</button>`;

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

    ${personalWarningHtml}

    <div class="rom-info-tabs">
    <button class="tab-btn active" onclick="switchTab('desc')">Details</button>
    <button class="tab-btn" onclick="switchTab('flash')">Installation</button>
    <button class="tab-btn" onclick="switchTab('screens')">Screenshots</button>
    </div>

    <div class="rom-description-container">
    <div id="tab-desc" class="tab-content active">
    ${descHtml}

    ${notesHtml ? `
        <div style="margin-top: 20px;">
        <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.2rem; margin-bottom: 10px;">Notes</h3>
        ${notesHtml}
        </div>` : ''}

        <div style="margin-top: 30px;">
        <h3 style="color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.2rem; margin-bottom: 10px;">Credits</h3>
        ${creditsHtml}
        </div>
        </div>

        <div id="tab-flash" class="tab-content">
        ${flashHtml}
        </div>

        <div id="tab-screens" class="tab-content">
        ${screenshotsHtml}
        </div>
        </div>

        <div style="margin-top: 35px; border-top: 1px solid var(--border); padding-top: 25px;">
        ${downloadButtonHtml}
        </div>
        </div>
        `;

        document.getElementById('page-home').classList.remove('active');
        document.getElementById('page-detail').classList.add('active');
}

function handleRouting() {
    const hash = window.location.hash;

    if (hash === '#personal') {
        isSecretMode = true;
        navigateHome(true);
    } else if (hash) {
        const romId = decodeURIComponent(hash.substring(1));
        viewDetail(romId);
    } else {
        isSecretMode = false;
        navigateHome(false);
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

let leafParticles = [];
let wind = {
    currentX: 0, targetX: 0,
    currentY: 2, targetY: 2
};

function createLeaves() {
    let container = document.getElementById('leaf-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'leaf-container';
        document.body.prepend(container);
    }

    const leafCount = 10;

    for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');

        const size = Math.random() * 30 + 30;

        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        leaf.style.opacity = Math.random() * 0.3 + 0.1;

        leaf.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M 4 20 C 4 10 14 4 20 4 C 20 14 10 20 4 20 Z"/></svg>`;

        container.appendChild(leaf);

        leafParticles.push({
            el: leaf,
            x: Math.random() * window.innerWidth,
                           y: Math.random() * window.innerHeight - window.innerHeight,
                           size: size,
                           mass: size / 20,
                           flutter: Math.random() * Math.PI * 2,
                           flutterSpeed: 0.02 + Math.random() * 0.03,
                           baseRotation: 45
        });
    }

    setInterval(() => {
        wind.targetX = (Math.random() - 0.5) * 12;
        wind.targetY = 2 + Math.random() * 0.1;
    }, 5000);

    requestAnimationFrame(animateLeaves);
}

function animateLeaves() {
    wind.currentX += (wind.targetX - wind.currentX) * 0.01;
    wind.currentY += (wind.targetY - wind.currentY) * 0.01;

    leafParticles.forEach(p => {
        let vx = wind.currentX * p.mass;
        let vy = wind.currentY * p.mass;

        p.x += vx;
        p.y += vy;
        p.flutter += p.flutterSpeed;

        let angle = Math.atan2(vy, vx) * (180 / Math.PI);
        let sway = Math.sin(p.flutter) * 15;

        if (p.y > window.innerHeight + 50) {
            p.y = -50;
            p.x = Math.random() * window.innerWidth;
        }
        if (p.x > window.innerWidth + 50) p.x = -50;
        if (p.x < -50) p.x = window.innerWidth + 50;

        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${angle + p.baseRotation + sway}deg)`;
    });

    requestAnimationFrame(animateLeaves);
}

async function loadAnnouncement() {
    const banner = document.getElementById('announcement-banner');
    const textContainer = document.getElementById('announcement-text');
    const closeBtn = document.getElementById('close-banner');

    if (!banner || !textContainer || !closeBtn) return;

    try {
        const response = await fetch('assets/announcement.txt?t=' + new Date().getTime());

        if (response.ok) {
            const rawText = await response.text();
            const blocks = rawText.replace(/\r/g, '').split('===');

            const now = new Date();
            let activeMessages = [];

            blocks.forEach(block => {
                const lines = block.trim().split('\n');

                if (lines.length >= 3) {
                    const startDateStr = lines[0].trim();
                    const endDateStr = lines[1].trim();
                    const messageText = lines.slice(2).join('\n').trim();

                    const startStrFixed = startDateStr.replace(/-/g, '/');
                    const endStrFixed = endDateStr.replace(/-/g, '/');

                    const startDate = new Date(startStrFixed);
                    startDate.setHours(0, 0, 0, 0);

                    const endDate = new Date(endStrFixed);
                    endDate.setHours(23, 59, 59, 999);

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
                                if (bannerTextContainer.classList.contains('expanded')) {
                                    expandBtn.textContent = 'View less';
                                } else {
                                    expandBtn.textContent = 'View more';
                                }
                            };
                        }
                    }
                }, 50);

                closeBtn.onclick = () => {
                    banner.classList.add('hidden');
                };
            }
        }
    } catch (error) {
        console.log("No announcement.");
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
