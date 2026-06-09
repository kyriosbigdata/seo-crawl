import path from 'path';
import { fileURLToPath } from 'url';

import { readJsonl } from '../helpers/readJsonl.mjs';
import { writeJsonl } from '../helpers/writeJsonl.mjs';
import { ensureDir } from '../helpers/ensureDir.mjs';
import { groupBy } from '../helpers/groupBy.mjs';
import { aggregateMonthlyRows } from '../helpers/aggregateMonthlyRows.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '..','..', 'data', 'base', 'queries_base.jsonl');
const outputDir = path.join(__dirname, '..','..', 'data', 'dashboard', 'total', 'queries');

function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function sortByDateAsc(rows) {
    return [...rows].sort((a, b) => new Date(a.fecha_ref) - new Date(b.fecha_ref));
}

function getMonthFileName(fechaRef) {
    const date = new Date(`${fechaRef}T00:00:00`);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}.jsonl`;
}

function buildComparisonRows(groupedRows) {
    const output = [];

    for (const [query, rows] of groupedRows.entries()) {
        const sortedRows = sortByDateAsc(rows);

        for (let i = 1; i < sortedRows.length; i++) {
            const prev = sortedRows[i - 1];
            const current = sortedRows[i];

            output.push({
                fecha_ref: current.fecha_ref,
                category: 'total',
                query,

                clicks_last_period: current.clicks,
                clicks_prev_period: prev.clicks,
                clicks_delta: current.clicks - prev.clicks,

                impressions_last_period: current.impressions,
                impressions_prev_period: prev.impressions,
                impressions_delta: current.impressions - prev.impressions,

                ctr_last_period: round(current.ctr),
                ctr_prev_period: round(prev.ctr),
                ctr_delta: round(current.ctr - prev.ctr),

                position_last_period: round(current.position),
                position_prev_period: round(prev.position),
                position_delta: round(current.position - prev.position)
            });
        }
    }

    return output.sort((a, b) => {
        const dateCompare = new Date(a.fecha_ref) - new Date(b.fecha_ref);
        if (dateCompare !== 0) return dateCompare;

        return a.query.localeCompare(b.query, 'es');
    });
}

function writeMonthlyFiles(rows) {
    const groupedByMonth = groupBy(rows, row => getMonthFileName(row.fecha_ref));

    ensureDir(outputDir);

    for (const [fileName, monthRows] of groupedByMonth.entries()) {
        const outputPath = path.join(outputDir, fileName);

        writeJsonl(outputPath, monthRows);

        console.log(`Archivo generado: ${outputPath}`);
        console.log(`Filas generadas: ${monthRows.length}`);
    }
}

function main() {
    const baseRows = readJsonl(inputPath);

    if (!baseRows.length) {
        console.log(`No hay filas para procesar en: ${inputPath}`);
        return;
    }

    const monthlyRows = aggregateMonthlyRows(
        baseRows,
        row => row.query,
        (row, monthRef) => ({
            fecha_ref: monthRef,
            query: row.query,
            category: 'total'
        })
    );

    const groupedByQuery = groupBy(monthlyRows, row => row.query);
    const dashboardRows = buildComparisonRows(groupedByQuery);

    writeMonthlyFiles(dashboardRows);
}

main();