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

function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    const normalized = String(value).trim().replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
}

function getSafeCategory(row) {
    return row.category || row.categoria || 'sin-categoria';
}

function sortByDateAsc(rows) {
    return [...rows].sort((a, b) => new Date(a.fecha_ref) - new Date(b.fecha_ref));
}

function buildMetric(current, previous) {
    return {
        val: round(toNumber(current)),
        var: round(toNumber(current) - toNumber(previous))
    };
}

function buildDashboardRows(rows, category) {
    const sortedRows = sortByDateAsc(rows);
    const output = [];

    for (let i = 1; i < sortedRows.length; i++) {
        const prev = sortedRows[i - 1];
        const current = sortedRows[i];

        output.push({
            fecha_ref: current.fecha_ref,
            category,
            indicadores: {
                posicion_aeo: buildMetric(current.posicion_aeo, prev.posicion_aeo),
                posicion_aeo_ai_overview: buildMetric(
                    current.posicion_aeo_ai_overview,
                    prev.posicion_aeo_ai_overview
                ),
                posicion_aeo_chatgpt: buildMetric(
                    current.posicion_aeo_chatgpt,
                    prev.posicion_aeo_chatgpt
                ),
                posicion_aeo_perplexity: buildMetric(
                    current.posicion_aeo_perplexity,
                    prev.posicion_aeo_perplexity
                ),
                posicion_aeo_gemini: buildMetric(
                    current.posicion_aeo_gemini,
                    prev.posicion_aeo_gemini
                ),
                posicion_aeo_ai_mode: buildMetric(
                    current.posicion_aeo_ai_mode,
                    prev.posicion_aeo_ai_mode
                ),

                competidores: buildMetric(current.competidores, prev.competidores),
                posicion_seo: buildMetric(current.posicion_seo, prev.posicion_seo),
                keywords_pautadas_competencia: buildMetric(
                    current.keywords_pautadas_competencia,
                    prev.keywords_pautadas_competencia
                ),
                cantidad_keywords: buildMetric(
                    current.cantidad_keywords,
                    prev.cantidad_keywords
                )
            },
            laterales: {
                backlinks: buildMetric(current.backlinks, prev.backlinks),
                spam: buildMetric(current.spam_score, prev.spam_score),
                nuevos_contenidos: buildMetric(
                    current.nuevos_contenidos,
                    prev.nuevos_contenidos
                ),
                da: buildMetric(current.da, prev.da),
                error: buildMetric(current.error, prev.error),
                clics: buildMetric(current.clics_keywords, prev.clics_keywords)
            },
            graficos: {
                conversiones_organic_search: [
                    round(toNumber(current.conversiones_organic_search))
                ],
                trafico_organic_search: [
                    round(toNumber(current.trafico_organic_search))
                ],
                embudo_conversiones: {
                    impresiones: round(toNumber(current.embudo_impresiones)),
                    clics: round(toNumber(current.embudo_clicks)),
                    conversiones: round(toNumber(current.embudo_conversiones))
                }
            }
        });
    }

    return output;
}

function writeCategoryResumen(category, rows) {
    const outputDir = path.join(outputRootDir, category);
    const outputPath = path.join(outputDir, 'resumen.jsonl');

    ensureDir(outputDir);
    writeJsonl(outputPath, rows);

    console.log(`Archivo generado: ${outputPath}`);
    console.log(`Filas generadas: ${rows.length}`);
}

function main() {
    const baseRows = readJsonl(inputPath);

    if (!baseRows.length) {
        console.log(`No hay filas para procesar en: ${inputPath}`);
        return;
    }

    const groupedByCategory = groupBy(baseRows, row => getSafeCategory(row));

    for (const [category, categoryRows] of groupedByCategory.entries()) {
        const dashboardRows = buildDashboardRows(categoryRows, category);
        writeCategoryResumen(category, dashboardRows);
    }
}

main();