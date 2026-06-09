import path from 'path';
import { fileURLToPath } from 'url';

import { readJsonl } from '../helpers/readJsonl.mjs';
import { writeJsonl } from '../helpers/writeJsonl.mjs';
import { ensureDir } from '../helpers/ensureDir.mjs';
import { groupBy } from '../helpers/groupBy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urlsBasePath = path.join(__dirname, '..', '..', 'data', 'base', 'urls_base.jsonl');
const queriesCategoryBasePath = path.join(__dirname, '..', '..', 'data', 'base', 'queries_category_base.jsonl');
const outputPath = path.join(__dirname, '..', '..', 'data', 'base', 'resumen_categories_base.jsonl');

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

function getMonthRef(fechaRef) {
    const date = new Date(`${fechaRef}T00:00:00`);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
}

function getSafeCategory(row) {
    return row.category || row.categoria || 'sin-categoria';
}

function getMonthCategoryKey(row) {
    return `${getMonthRef(row.fecha_ref)}|||${getSafeCategory(row)}`;
}

function sum(rows, key) {
    return rows.reduce((acc, row) => acc + toNumber(row[key]), 0);
}

function weightedAveragePosition(rows) {
    let weightedSum = 0;
    let totalImpressions = 0;

    for (const row of rows) {
        const impressions = toNumber(row.impressions);
        const position = toNumber(row.position);

        weightedSum += position * impressions;
        totalImpressions += impressions;
    }

    if (totalImpressions === 0) return 0;

    return weightedSum / totalImpressions;
}

function getAllKeys(...groups) {
    const set = new Set();

    groups.forEach(group => {
        for (const key of group.keys()) {
            set.add(key);
        }
    });

    return Array.from(set).sort((a, b) => {
        const [dateA, categoryA] = a.split('|||');
        const [dateB, categoryB] = b.split('|||');

        const dateCompare = new Date(dateA) - new Date(dateB);
        if (dateCompare !== 0) return dateCompare;

        return categoryA.localeCompare(categoryB, 'es');
    });
}

/* BLOQUE 1: métricas calculadas desde urls_base.jsonl */

function buildMetricsFromUrls(urlsRows) {
    const groupedByMonthCategory = groupBy(urlsRows, getMonthCategoryKey);
    const metricsByKey = new Map();

    for (const [key, rows] of groupedByMonthCategory.entries()) {
        const impressions = sum(rows, 'impressions');
        const clicks = sum(rows, 'clicks');

        metricsByKey.set(key, {
            trafico_organic_search: round(clicks),
            embudo_impresiones: round(impressions),
            embudo_clicks: round(clicks),
            posicion_seo: round(weightedAveragePosition(rows))
        });
    }

    return metricsByKey;
}

/* BLOQUE 2: métricas calculadas desde queries_category_base.jsonl */

function buildMetricsFromQueriesCategory(queriesRows) {
    const groupedByMonthCategory = groupBy(queriesRows, getMonthCategoryKey);
    const metricsByKey = new Map();

    for (const [key, rows] of groupedByMonthCategory.entries()) {
        const uniqueQueries = new Set();

        rows.forEach(row => {
            if (row.query) {
                uniqueQueries.add(row.query);
            }
        });

        metricsByKey.set(key, {
            clics_keywords: round(sum(rows, 'clicks')),
            cantidad_keywords: uniqueQueries.size
        });
    }

    return metricsByKey;
}

/* BLOQUE 3: métricas provisionales hasta conectar otras fuentes */

function buildFallbackMetrics() {
    return {
        posicion_aeo: 0,
        posicion_aeo_ai_overview: 0,
        posicion_aeo_chatgpt: 0,
        posicion_aeo_perplexity: 0,
        posicion_aeo_gemini: 0,
        posicion_aeo_ai_mode: 0,
        competidores: 0,
        keywords_pautadas_competencia: 0,
        backlinks: 0,
        spam_score: 0,
        nuevos_contenidos: 0,
        da: 0,
        error: 0,
        conversiones_organic_search: 0,
        embudo_conversiones: 0
    };
}

/* BLOQUE 4: unión de todos los bloques */

function buildResumenCategoriesBaseRows({
    urlsMetricsByKey,
    queriesMetricsByKey
}) {
    const allKeys = getAllKeys(
        urlsMetricsByKey,
        queriesMetricsByKey
    );

    return allKeys.map(key => {
        const [fechaRef, category] = key.split('|||');

        const fallback = buildFallbackMetrics();
        const urlsMetrics = urlsMetricsByKey.get(key) || {};
        const queriesMetrics = queriesMetricsByKey.get(key) || {};

        return {
            fecha_ref: fechaRef,
            category,

            posicion_aeo: fallback.posicion_aeo,
            posicion_aeo_ai_overview: fallback.posicion_aeo_ai_overview,
            posicion_aeo_chatgpt: fallback.posicion_aeo_chatgpt,
            posicion_aeo_perplexity: fallback.posicion_aeo_perplexity,
            posicion_aeo_gemini: fallback.posicion_aeo_gemini,
            posicion_aeo_ai_mode: fallback.posicion_aeo_ai_mode,
            competidores: fallback.competidores,
            posicion_seo: urlsMetrics.posicion_seo ?? 0,
            keywords_pautadas_competencia: fallback.keywords_pautadas_competencia,
            cantidad_keywords: queriesMetrics.cantidad_keywords ?? 0,

            backlinks: fallback.backlinks,
            spam_score: fallback.spam_score,
            nuevos_contenidos: fallback.nuevos_contenidos,
            da: fallback.da,
            error: fallback.error,
            clics_keywords: queriesMetrics.clics_keywords ?? 0,

            conversiones_organic_search: fallback.conversiones_organic_search,
            trafico_organic_search: urlsMetrics.trafico_organic_search ?? 0,
            embudo_impresiones: urlsMetrics.embudo_impresiones ?? 0,
            embudo_clicks: urlsMetrics.embudo_clicks ?? 0,
            embudo_conversiones: fallback.embudo_conversiones
        };
    });
}

function main() {
    const urlsRows = readJsonl(urlsBasePath);
    const queriesRows = readJsonl(queriesCategoryBasePath);

    if (!urlsRows.length && !queriesRows.length) {
        console.log('No hay filas para procesar en urls_base.jsonl ni queries_category_base.jsonl');
        return;
    }

    const urlsMetricsByKey = buildMetricsFromUrls(urlsRows);
    const queriesMetricsByKey = buildMetricsFromQueriesCategory(queriesRows);

    const resumenRows = buildResumenCategoriesBaseRows({
        urlsMetricsByKey,
        queriesMetricsByKey
    });

    ensureDir(path.dirname(outputPath));
    writeJsonl(outputPath, resumenRows);

    console.log(`Archivo generado: ${outputPath}`);
    console.log(`Filas generadas: ${resumenRows.length}`);
}

main();