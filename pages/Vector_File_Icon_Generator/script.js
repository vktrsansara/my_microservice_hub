const state = {
    bgColor: '#50D2FE', foldColor: '#236FE0', autoFoldColor: true, cornerRadius: 24, foldSize: 60,
    text: 'TXT', textColor: '#236FE0', textFont: 'Montserrat', textSize: 80, textOffsetX: 0, textOffsetY: 15,
    overlayType: 'none', materialIcon: 'image', materialIconPath: null, materialIconViewBox: '0 0 48 48',
    iconBold: false,
    customImgSrc: null, imgScale: 100, imgOffsetX: 0, imgOffsetY: 0,
    pngExportSize: 256
};

const materialIconPathCache = {};

const colorPresets = [
    { bg: '#50D2FE', fold: '#236FE0' },
    { bg: '#34D399', fold: '#047857' },
    { bg: '#F472B6', fold: '#E11D48' },
    { bg: '#38BDF8', fold: '#0284C7' },
    { bg: '#EF4444', fold: '#991B1B' },
    { bg: '#C084FC', fold: '#7E22CE' },
    { bg: '#FB923C', fold: '#C2410C' },
    { bg: '#FDE047', fold: '#CA8A04' },
    { bg: '#2DD4BF', fold: '#0F766E' },
    { bg: '#818CF8', fold: '#4338CA' },
    { bg: '#94A3B8', fold: '#475569' },
    { bg: '#FB7185', fold: '#BE123C' },
    { bg: '#A3E635', fold: '#4D7C0F' },
    { bg: '#FBBF24', fold: '#B45309' },
    { bg: '#E879F9', fold: '#A21CAF' },
    { bg: '#1E293B', fold: '#0F172A' },
    { bg: '#22D3EE', fold: '#0891B2' },
    { bg: '#8B5CF6', fold: '#6D28D9' },
    { bg: '#A8A29E', fold: '#57534E' },
    { bg: '#FDBA74', fold: '#C2410C' },
    { bg: '#6EE7B7', fold: '#059669' },
    { bg: '#1E3A8A', fold: '#172554' },
    { bg: '#065F46', fold: '#022C22' },
    { bg: '#92400E', fold: '#451A03' }
];

let selectedCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initInputs();
    initModalCatalog();
    renderColorPresets();
    initPresetsScroll();
    renderVectorIcon();
});

function renderColorPresets() {
    const container = document.getElementById('presetsContainer');
    container.innerHTML = colorPresets.map(p => `
        <button onclick="applyPreset('${p.bg}', '${p.fold}')" class="w-full h-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 flex flex-col items-center justify-center transition group snap-start">
            <div class="w-6 h-8 rounded-sm relative overflow-hidden shadow border border-white/5 transition-transform group-hover:scale-110" style="background-color: ${p.bg}">
                <div class="absolute top-0 right-0 w-2.5 h-2.5" style="background-color: ${p.fold}"></div>
            </div>
        </button>
    `).join('');
}

function initPresetsScroll() {
    const container = document.getElementById('presetsContainer');
    container.addEventListener('wheel', (evt) => {
        if (Math.abs(evt.deltaY) > Math.abs(evt.deltaX)) {
            evt.preventDefault();
            container.scrollLeft += evt.deltaY;
        }
    });
}

function applyPreset(bgColor, foldColor) {
    state.bgColor = bgColor;
    state.foldColor = foldColor;
    state.autoFoldColor = false;
    document.getElementById('autoFoldColor').checked = false;
    syncInputsWithState();
    renderVectorIcon();
    showToast('Цветовой пресет применен');
}

async function getMaterialIconPath(iconName) {
    if (materialIconPathCache[iconName]) {
        return materialIconPathCache[iconName];
    }
    const candidateUrls = [
        `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${iconName}/default/48px.svg`,
        `https://fonts.gstatic.com/s/i/materialsymbolsoutlined/${iconName}/default/48px.svg`
    ];

    let svgText = null;
    let lastError = null;
    for (const url of candidateUrls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                svgText = await response.text();
                break;
            }
            lastError = new Error(`HTTP ${response.status} для "${iconName}"`);
        } catch (err) {
            lastError = err;
        }
    }

    if (!svgText) {
        throw lastError || new Error(`Не удалось загрузить контур для "${iconName}"`);
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    const pathEl = doc.querySelector('path');
    if (!svgEl || !pathEl) {
        throw new Error(`Контур для "${iconName}" не найден`);
    }
    const result = {
        d: pathEl.getAttribute('d'),
        viewBox: svgEl.getAttribute('viewBox') || '0 0 48 48'
    };
    materialIconPathCache[iconName] = result;
    return result;
}

function generateSvgString() {
    const width = 240;
    const height = 300;
    const r = state.cornerRadius;
    const fold = state.foldSize;

    const bodyPath = `
        M ${r},0
        L ${width - fold},0
        L ${width},${fold}
        L ${width},${height - r}
        A ${r},${r} 0 0 1 ${width - r},${height}
        L ${r},${height}
        A ${r},${r} 0 0 1 0,${height - r}
        L 0,${r}
        A ${r},${r} 0 0 1 ${r},0
        Z
    `.replace(/\s+/g, ' ').trim();

    const flapRadius = Math.min(16, fold / 3);
    const flapPath = `
        M ${width - fold},0
        L ${width - fold},${fold - flapRadius}
        A ${flapRadius},${flapRadius} 0 0 0 ${width - fold + flapRadius},${fold}
        L ${width},${fold}
        Z
    `.replace(/\s+/g, ' ').trim();

    let textElement = '';
    if (state.text && state.text.trim() !== '') {
        const textX = (width / 2) + state.textOffsetX;
        const textY = (height / 2 + 15) + state.textOffsetY;
        textElement = `
            <text x="${textX}" y="${textY}"
                  fill="${state.textColor}"
                  font-family="${state.textFont}, sans-serif"
                  font-size="${state.textSize}px"
                  font-weight="900"
                  text-anchor="middle"
                  dominant-baseline="central"
                  letter-spacing="-1px">
                ${escapeXml(state.text)}
            </text>
        `;
    }

    let overlayElement = '';
    const centerX = (width / 2) + state.imgOffsetX;
    const centerY = (height / 2 + 10) + state.imgOffsetY;
    const scale = state.imgScale / 100;

    if (state.overlayType === 'material' && state.materialIconPath) {
        const [vbX, vbY, vbWidth, vbHeight] = state.materialIconViewBox.split(' ').map(Number);
        const safeVbWidth = vbWidth || 48;
        const safeVbHeight = vbHeight || 48;
        const iconSize = 85 * scale;
        const scaleFactor = iconSize / safeVbWidth;
        const translateX = centerX - (vbX + safeVbWidth / 2) * scaleFactor;
        const translateY = centerY - (vbY + safeVbHeight / 2) * scaleFactor;
        const boldStrokeWidth = safeVbWidth * 0.045;
        const boldAttrs = state.iconBold
            ? ` stroke="${state.textColor}" stroke-width="${boldStrokeWidth}" stroke-linejoin="round" paint-order="stroke fill"`
            : '';
        overlayElement = `
            <g transform="translate(${translateX}, ${translateY}) scale(${scaleFactor})">
                <path d="${state.materialIconPath}" fill="${state.textColor}"${boldAttrs} />
            </g>
        `;
    } else if (state.overlayType === 'custom' && state.customImgSrc) {
        const imgWidth = 120 * scale;
        const imgHeight = 120 * scale;
        overlayElement = `
            <image x="${centerX - imgWidth / 2}" y="${centerY - imgHeight / 2}"
                   width="${imgWidth}" height="${imgHeight}"
                   xmlns:xlink="http://www.w3.org/1999/xlink"
                   xlink:href="${state.customImgSrc}"
                   preserveAspectRatio="xMidYMid meet" />
        `;
    }

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.15"/>
        </filter>
    </defs>
    <g filter="url(#shadow)">
        <path d="${bodyPath}" fill="${state.bgColor}" />
        <path d="${flapPath}" fill="${state.foldColor}" />
    </g>
    ${textElement}
    ${overlayElement}
</svg>`.trim();
}

function renderVectorIcon() {
    document.getElementById('svgWrapper').innerHTML = generateSvgString();
}

function downloadSvg() {
    const svgContent = generateSvgString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    let safeName = (state.text || state.materialIcon || 'custom').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    a.download = `file-icon-${safeName}.svg`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('SVG файл успешно скачан!');
}

function downloadPng() {
    const svgString = generateSvgString();

    const canvas = document.getElementById('exportCanvas');
    const ctx = canvas.getContext('2d');
    const size = state.pngExportSize;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function () {
        ctx.clearRect(0, 0, size, size);
        const scale = size / 300;
        const dw = 240 * scale;
        const dh = 300 * scale;
        const dx = (size - dw) / 2;
        const dy = (size - dh) / 2;

        ctx.drawImage(img, dx, dy, dw, dh);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;

        let safeName = (state.text || state.materialIcon || 'custom').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        a.download = `file-icon-${safeName}-${size}x${size}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 500);
        showToast(`PNG (${size}x${size}px) успешно скачан!`);
    };
    img.onerror = function () {
        setTimeout(() => URL.revokeObjectURL(url), 500);
        showToast('Не удалось сформировать PNG. Попробуйте ещё раз.');
    };
    img.src = url;
}

function copySvgCode() {
    const textarea = document.createElement('textarea');
    textarea.value = generateSvgString();
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Код SVG скопирован');
}

function initInputs() {
    ['bgColor', 'foldColor', 'textColor'].forEach(colorId => {
        const inp = document.getElementById(colorId);
        const hex = document.getElementById(`${colorId}Hex`);
        inp.addEventListener('input', e => {
            state[colorId] = e.target.value;
            hex.value = e.target.value.toUpperCase();
            if (colorId === 'bgColor' && state.autoFoldColor) {
                state.foldColor = adjustBrightness(state.bgColor, -25);
                document.getElementById('foldColor').value = state.foldColor;
                document.getElementById('foldColorHex').value = state.foldColor.toUpperCase();
            }
            if (colorId === 'foldColor') {
                state.autoFoldColor = false;
                document.getElementById('autoFoldColor').checked = false;
            }
            renderVectorIcon();
        });
        hex.addEventListener('change', e => {
            if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                state[colorId] = e.target.value;
                inp.value = e.target.value;
                renderVectorIcon();
            }
        });
    });

    document.getElementById('autoFoldColor').addEventListener('change', e => {
        state.autoFoldColor = e.target.checked;
        if (state.autoFoldColor) {
            state.foldColor = adjustBrightness(state.bgColor, -25);
            document.getElementById('foldColor').value = state.foldColor;
            document.getElementById('foldColorHex').value = state.foldColor.toUpperCase();
            renderVectorIcon();
        }
    });

    const binds = [
        { id: 'cornerRadius', st: 'cornerRadius', unit: 'px' },
        { id: 'foldSize', st: 'foldSize', unit: 'px' },
        { id: 'textSize', st: 'textSize', unit: 'px' },
        { id: 'textOffsetX', st: 'textOffsetX', unit: '' },
        { id: 'textOffsetY', st: 'textOffsetY', unit: '' },
        { id: 'imgScale', st: 'imgScale', unit: '%' },
        { id: 'imgOffsetX', st: 'imgOffsetX', unit: '' },
        { id: 'imgOffsetY', st: 'imgOffsetY', unit: '' }
    ];
    binds.forEach(b => {
        const el = document.getElementById(b.id);
        const valEl = document.getElementById(`${b.id}Val`);
        el.addEventListener('input', e => {
            state[b.st] = parseInt(e.target.value);
            valEl.textContent = e.target.value + b.unit;
            renderVectorIcon();
        });
    });

    document.getElementById('iconText').addEventListener('input', e => { state.text = e.target.value; renderVectorIcon(); });
    document.getElementById('textFont').addEventListener('change', e => { state.textFont = e.target.value; renderVectorIcon(); });

    document.getElementById('imageUpload').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = evt => {
                state.customImgSrc = evt.target.result;
                state.overlayType = 'custom';
                document.getElementById('uploadLabelText').textContent = file.name;
                document.getElementById('clearImageBtn').classList.remove('hidden');
                renderVectorIcon();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('clearImageBtn').addEventListener('click', () => {
        state.customImgSrc = null;
        state.overlayType = 'none';
        document.getElementById('imageUpload').value = '';
        document.getElementById('uploadLabelText').textContent = 'Выберите PNG файл...';
        document.getElementById('clearImageBtn').classList.add('hidden');
        renderVectorIcon();
    });

    document.getElementById('iconBold').addEventListener('change', e => {
        state.iconBold = e.target.checked;
        renderVectorIcon();
    });

    document.getElementById('copySvgBtn').addEventListener('click', copySvgCode);
    document.getElementById('downloadSvgBtn').addEventListener('click', downloadSvg);
    document.getElementById('downloadPngBtn').addEventListener('click', downloadPng);
}

function syncInputsWithState() {
    document.getElementById('bgColor').value = state.bgColor;
    document.getElementById('bgColorHex').value = state.bgColor.toUpperCase();
    document.getElementById('foldColor').value = state.foldColor;
    document.getElementById('foldColorHex').value = state.foldColor.toUpperCase();
}

function setPresetOverlay(type) {
    state.overlayType = type;
    if (type !== 'custom') {
        state.customImgSrc = null;
        document.getElementById('clearImageBtn').classList.add('hidden');
        document.getElementById('uploadLabelText').textContent = 'Выберите PNG файл...';
    }
    renderVectorIcon();
}

async function setMaterialOverlay(iconName) {
    state.overlayType = 'material';
    state.materialIcon = iconName;
    state.materialIconPath = null;
    state.customImgSrc = null;
    document.getElementById('clearImageBtn').classList.add('hidden');
    document.getElementById('uploadLabelText').textContent = 'Выберите PNG файл...';
    renderVectorIcon();

    try {
        const iconData = await getMaterialIconPath(iconName);
        if (state.materialIcon !== iconName) {
            return;
        }
        state.materialIconPath = iconData.d;
        state.materialIconViewBox = iconData.viewBox;
        renderVectorIcon();
        showToast(`Выбран значок "${iconName}"`);
    } catch (err) {
        showToast('Не удалось загрузить векторный контур значка');
    }
}

function setPngExportSize(size, btnElement) {
    state.pngExportSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('bg-cyan-600/30', 'border-cyan-500', 'text-cyan-300');
        btn.classList.add('bg-slate-800', 'border-slate-700', 'text-slate-300');
    });
    btnElement.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-300');
    btnElement.classList.add('bg-cyan-600/30', 'border-cyan-500', 'text-cyan-300');
    document.getElementById('downloadPngBtnText').textContent = `Скачать PNG (${size}x${size})`;
}

function initModalCatalog() {
    document.getElementById('categoriesList').innerHTML = iconCategories.map(cat => `
        <button onclick="selectCategory('${cat.id}')"
                class="cat-btn w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${selectedCategory === cat.id ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}">
            <span class="material-symbols-outlined text-base">${cat.icon}</span>
            <span>${cat.name}</span>
        </button>
    `).join('');
    renderIconsGrid();
    document.getElementById('iconSearchInput').addEventListener('input', e => renderIconsGrid(e.target.value));
}

function renderIconsGrid(query = '') {
    query = query.toLowerCase().trim();
    const filtered = materialCatalog.filter(i => (selectedCategory === 'all' || i.category === selectedCategory) && (!query || i.name.includes(query) || i.label.toLowerCase().includes(query)));
    if (filtered.length === 0) {
        document.getElementById('materialIconsGrid').innerHTML = '';
        document.getElementById('noIconsFound').classList.remove('hidden');
        return;
    }
    document.getElementById('noIconsFound').classList.add('hidden');
    document.getElementById('materialIconsGrid').innerHTML = filtered.map(item => `
        <button onclick="setMaterialOverlay('${item.name}'); closeIconModal();"
                class="p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-600/20 hover:border-cyan-500 border border-slate-700/60 flex flex-col items-center justify-center gap-1 transition group text-center">
            <span class="material-symbols-outlined text-2xl text-slate-300 group-hover:text-cyan-400 group-hover:scale-110 transition-transform">${item.name}</span>
            <span class="text-[10px] text-slate-400 group-hover:text-cyan-200 truncate w-full">${item.label}</span>
        </button>
    `).join('');
}

function selectCategory(catId) {
    selectedCategory = catId;
    initModalCatalog();
    renderIconsGrid(document.getElementById('iconSearchInput').value);
}

function openIconModal() {
    document.getElementById('iconModal').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('iconModalContainer').classList.replace('scale-95', 'scale-100');
}

function closeIconModal() {
    document.getElementById('iconModal').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('iconModalContainer').classList.replace('scale-100', 'scale-95');
}

function adjustBrightness(hex, percent) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    let num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function escapeXml(unsafe) {
    return unsafe ? unsafe.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])) : '';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none'), 3000);
}
