import path from 'path';
import { fileURLToPath } from 'url';

import { readJsonl } from '../helpers/readJsonl.mjs';
import { writeJsonl } from '../helpers/writeJsonl.mjs';
import { ensureDir } from '../helpers/ensureDir.mjs';
import { groupBy } from '../helpers/groupBy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'base',
    'resumen_categories_base.jsonl'
);

const outputPath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'base',
    'resumen_base.jsonl'
);

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

function sum(rows, key) {
    return rows.reduce((acc, row) => acc + toNumber(row[key]), 0);
}

function average(rows, key) {
    if (!rows.length) return 0;

    const validValues = rows
        .map(row => toNumber(row[key]))
        .filter(value => Number.isFinite(value));

    if (!validValues.length) return 0;

    const total = validValues.reduce((acc, value) => acc + value, 0);
    return total / validValues.length;
}

function sortByDateAsc(rows) {
    return [...rows].sort((a, b) => new Date(a.fecha_ref) - new Date(b.fecha_ref));
}

function buildTotalResumenRows(baseRows) {
    const groupedByDate = groupBy(baseRows, row => row.fecha_ref);
    const output = [];

    for (const [fecha_ref, rows] of groupedByDate.entries()) {
        output.push({
            fecha_ref,
            category: 'total',

            posicion_aeo: round(average(rows, 'posicion_aeo')),
            competidores: round(sum(rows, 'competidores')),
            posicion_seo: round(average(rows, 'posicion_seo')),
            keywords_pautadas_competencia: round(sum(rows, 'keywords_pautadas_competencia')),
            cantidad_keywords: round(sum(rows, 'cantidad_keywords')),

            backlinks: round(sum(rows, 'backlinks')),
            spam_score: round(average(rows, 'spam_score')),
            nuevos_contenidos: round(sum(rows, 'nuevos_contenidos')),
            da: round(average(rows, 'da')),
            error: round(sum(rows, 'error')),
            clics_keywords: round(sum(rows, 'clics_keywords')),

            conversiones_organic_search: round(sum(rows, 'conversiones_organic_search')),
            trafico_organic_search: round(sum(rows, 'trafico_organic_search')),
            embudo_impresiones: round(sum(rows, 'embudo_impresiones')),
            embudo_clicks: round(sum(rows, 'embudo_clicks')),
            embudo_conversiones: round(sum(rows, 'embudo_conversiones'))
        });
    }

    return sortByDateAsc(output);
}

function main() {
    const baseRows = readJsonl(inputPath);

    if (!baseRows.length) {
        console.log(`No hay filas para procesar en: ${inputPath}`);
        return;
    }

    const totalRows = buildTotalResumenRows(baseRows);

    ensureDir(path.dirname(outputPath));
    writeJsonl(outputPath, totalRows);

    console.log(`Archivo generado: ${outputPath}`);
    console.log(`Filas generadas: ${totalRows.length}`);
}

main();