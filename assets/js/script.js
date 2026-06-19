document.addEventListener("DOMContentLoaded", () => {
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

    renderROMCards();
    handleRouting();
});

function renderROMCards() {
    const container = document.getElementById('cards-container');
    if (!container || !window.romData) return;

    container.innerHTML = window.romData.map(rom => `
    <div class="rom-card glass" onclick="viewDetail(${rom.id})">
    <h3 style="font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; color: var(--accent); letter-spacing: -0.5px;">${rom.name}</h3>
    <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Device: <span style="color: var(--text); font-weight: 500;">${rom.device}</span></p>
    <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 24px;">Version: <span style="color: var(--text); font-weight: 500;">${rom.version}</span></p>
    <button class="btn-dl primary" style="width: 100%;">Get ROM</button>
    </div>
    `).join('');
}

function navigateHome() {
    if (window.location.hash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-home').classList.add('active');
}

let activeDownloadUrl = "";

function viewDetail(id) {
    const rom = window.romData.find(r => r.id === id);
    if (!rom) return;

    activeDownloadUrl = rom.downloadUrl;
    window.location.hash = `rom-${id}`;

    let markdownText = rom.description || "No description available.";

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
    if (hash && hash.startsWith('#rom-')) {
        const romId = parseInt(hash.replace('#rom-', ''));
        setTimeout(() => {
            viewDetail(romId);
        }, 100);
    } else {
        navigateHome();
    }
}

function openImageModal(imgSrc) {
    const modal = document.getElementById('reader-modal');
    const title = document.getElementById('reader-title');
    const content = document.getElementById('reader-content');

    title.textContent = "Screenshot Preview";
    content.innerHTML = `
    <img src="${imgSrc}" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 16px;" alt="Preview">
    `;
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
    if (!window.location.hash) {
        navigateHome();
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
