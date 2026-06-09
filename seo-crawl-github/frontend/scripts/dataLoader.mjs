async function loadJSONL(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${path} (${response.status})`);
    }

    const text = await response.text();

    if (!text.trim()) {
        return [];
    }

    return text
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
}

function getMonthFileName(fechaRef) {
    const date = new Date(`${fechaRef}T00:00:00`);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}.jsonl`;
}

export async function loadResumenData(dataBasePath) {
    return loadJSONL(`${dataBasePath}/resumen.jsonl`).catch(() => []);
}

export async function loadMonthlyDashboardData(dataBasePath, selectedDate) {
    const monthFileName = getMonthFileName(selectedDate);

    const [urlsData, queriesData] = await Promise.all([
        loadJSONL(`${dataBasePath}/urls/${monthFileName}`).catch(() => []),
        loadJSONL(`${dataBasePath}/queries/${monthFileName}`).catch(() => [])
    ]);

    return {
        urlsData,
        queriesData
    };
}

export async function loadDashboardData(dataBasePath) {
    const resumenData = await loadResumenData(dataBasePath);

    return {
        resumenData,
        urlsData: [],
        queriesData: []
    };
}