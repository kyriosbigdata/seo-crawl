export function getAvailableDates({
    resumenData = [],
    urlsData = [],
    queriesData = []
}) {
    const set = new Set();

    resumenData.forEach(item => set.add(item.fecha_ref));
    urlsData.forEach(item => set.add(item.fecha_ref));
    queriesData.forEach(item => set.add(item.fecha_ref));

    return Array.from(set).sort((a, b) => new Date(a) - new Date(b));
}

export function getResumenRowByDate(resumenData, selectedDate) {
    return resumenData.find(item => item.fecha_ref === selectedDate) || null;
}