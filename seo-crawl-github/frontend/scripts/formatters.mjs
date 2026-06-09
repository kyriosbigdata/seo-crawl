export function formatValue(value) {
    if (value === null || value === undefined || value === '') return '--';

    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toLocaleString('es-EC');
        }

        return value.toLocaleString('es-EC', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    return String(value);
}

export function formatPercent(value) {
    if (value === null || value === undefined || value === '') return '--';
    return `${formatValue(value)}%`;
}

export function formatMonthLabel(fecha) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const date = new Date(`${fecha}T00:00:00`);
    return `${meses[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTrendIcon(value) {
    return Number(value) >= 0 ? 'arrow-up' : 'arrow-down';
}

export function formatTrendHTML(value, isPercent = true, reverseColors = false) {
    if (value === null || value === undefined || value === '') {
        return '--';
    }

    const numericValue = Number(value);
    const isPositive = numericValue >= 0;

    let trendClass = isPositive ? 'up' : 'down';

    if (reverseColors) {
        trendClass = isPositive ? 'down' : 'up';
    }

    return `
        <span class="trend ${trendClass}">
            <i data-lucide="${getTrendIcon(numericValue)}"></i>
            ${Math.abs(numericValue)}${isPercent ? '%' : ''}
        </span>
    `;
}

export function formatDeltaCell(value, reverseColors = false, suffix = '') {
    const numericValue = Number(value);
    const positive = numericValue >= 0;

    let className = positive ? 'delta-positive' : 'delta-negative';

    if (reverseColors) {
        className = positive ? 'delta-negative' : 'delta-positive';
    }

    const prefix = numericValue > 0 ? '+' : '';

    return `<span class="${className}">${prefix}${formatValue(numericValue)}${suffix}</span>`;
}