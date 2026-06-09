export function groupBy(rows, getKey) {
    const grouped = new Map();

    for (const row of rows) {
        const key = getKey(row);

        if (!grouped.has(key)) {
            grouped.set(key, []);
        }

        grouped.get(key).push(row);
    }

    return grouped;
}