import {
    formatValue,
    formatTrendHTML
} from './formatters.mjs';

export function updateSidebar(laterales) {
    const container = document.getElementById('sideIndicators');
    if (!container) return;

    const items = [
        { key: 'backlinks', label: 'Backlinks', reverseColors: false },
        { key: 'spam', label: 'Spam Score', reverseColors: false },
        { key: 'nuevos_contenidos', label: 'Nuevos Contenidos', reverseColors: false },
        { key: 'da', label: 'DA', reverseColors: false },
        { key: 'error', label: 'Error', reverseColors: false },
        { key: 'clics', label: 'Clics Keywords', reverseColors: false }
    ];

    container.innerHTML = items.map(item => {
        const info = laterales[item.key];

        return `
            <div class="mini-indicator">
                <span class="mini-label">${item.label}</span>
                <span class="value">${info ? formatValue(info.val) : '--'}</span>
                ${info ? formatTrendHTML(info.var, true, item.reverseColors) : '<span class="trend">--</span>'}
            </div>
        `;
    }).join('');

    lucide.createIcons();
}