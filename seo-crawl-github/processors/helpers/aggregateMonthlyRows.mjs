export function getMonthRef(fechaRef) {
    const date = new Date(`${fechaRef}T00:00:00`);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
}

function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    const normalized = String(value).trim().replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
}

export function aggregateMonthlyRows(rows, getGroupKey, buildBaseRow) {
    const grouped = new Map();

    for (const row of rows) {
        const monthRef = getMonthRef(row.fecha_ref);
        const groupKey = `${monthRef}|||${getGroupKey(row)}`;

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                monthRef,
                baseRow: buildBaseRow(row, monthRef),
                clicks: 0,
                impressions: 0,
                weightedPositionSum: 0
            });
        }

        const group = grouped.get(groupKey);

        const clicks = toNumber(row.clicks);
        const impressions = toNumber(row.impressions);
        const position = toNumber(row.position);

        group.clicks += clicks;
        group.impressions += impressions;
        group.weightedPositionSum += position * impressions;
    }

    return Array.from(grouped.values()).map(group => {
        const ctr = group.impressions > 0
            ? (group.clicks / group.impressions) * 100
            : 0;

        const position = group.impressions > 0
            ? group.weightedPositionSum / group.impressions
            : 0;

        return {
            ...group.baseRow,
            fecha_ref: group.monthRef,
            clicks: round(group.clicks),
            impressions: round(group.impressions),
            ctr: round(ctr),
            position: round(position)
        };
    });
}
