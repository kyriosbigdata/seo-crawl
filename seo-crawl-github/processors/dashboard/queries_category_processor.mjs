import path from 'path';
import { fileURLToPath } from 'url';

import { readJsonl } from '../helpers/readJsonl.mjs';
import { writeJsonl } from '../helpers/writeJsonl.mjs';
import { ensureDir } from '../helpers/ensureDir.mjs';
import { groupBy } from '../helpers/groupBy.mjs';
import { aggregateMonthlyRows } from '../helpers/aggregateMonthlyRows.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'base',
    'queries_category_base.jsonl'
);

const outputRootDir = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'dashboard'
);

function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function getSafeCategory(row) {
    return row.category || row.categoria || 'sin-categoria';
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

function getComparisonGroupKey(row) {
    return `${getSafeCategory(row)}|||${row.query}|||${row.url}`;
}

function buildComparisonRows(groupedRows) {
    const output = [];

    for (const [groupKey, rows] of groupedRows.entries()) {
        const [category, query, url] = groupKey.split('|||');
        const sortedRows = sortByDateAsc(rows);

        for (let i = 1; i < sortedRows.length; i++) {
            const prev = sortedRows[i - 1];
            const current = sortedRows[i];

            output.push({
                fecha_ref: current.fecha_ref,
                category,
                query,
                url,

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
        const categoryCompare = a.category.localeCompare(b.category, 'es');
        if (categoryCompare !== 0) return categoryCompare;

        const dateCompare = new Date(a.fecha_ref) - new Date(b.fecha_ref);
        if (dateCompare !== 0) return dateCompare;

        const queryCompare = a.query.localeCompare(b.query, 'es');
        if (queryCompare !== 0) return queryCompare;

        return a.url.localeCompare(b.url, 'es');
    });
}

function writeCategoryMonthlyFiles(rows) {
    const groupedByCategory = groupBy(rows, row => getSafeCategory(row));

    for (const [category, categoryRows] of groupedByCategory.entries()) {
        const categoryQueriesDir = path.join(
            outputRootDir,
            category,
            'queries'
        );

        ensureDir(categoryQueriesDir);

        const groupedByMonth = groupBy(
            categoryRows,
            row => getMonthFileName(row.fecha_ref)
        );

        for (const [fileName, monthRows] of groupedByMonth.entries()) {
            const outputPath = path.join(categoryQueriesDir, fileName);

            writeJsonl(outputPath, monthRows);

            console.log(`Archivo generado: ${outputPath}`);
            console.log(`Filas generadas: ${monthRows.length}`);
        }
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
        row => `${getSafeCategory(row)}|||${row.query}|||${row.url}`,
        (row, monthRef) => ({
            fecha_ref: monthRef,
            category: getSafeCategory(row),
            query: row.query,
            url: row.url
        })
    );

    const groupedRows = groupBy(monthlyRows, getComparisonGroupKey);
    const dashboardRows = buildComparisonRows(groupedRows);

    writeCategoryMonthlyFiles(dashboardRows);
}

main();