import {
    formatValue,
    formatTrendHTML
} from './formatters.mjs';

function setKpiCard(cardId, metric, options = {}) {
    const { reverseColors = false } = options;
    const valueEl = document.querySelector(`#${cardId} .value`);
    const trendEl = document.querySelector(`#${cardId} .trend`);

    if (valueEl) {
        valueEl.textContent = metric ? formatValue(metric.val) : '--';
    }

    if (trendEl) {
        trendEl.innerHTML = metric
            ? formatTrendHTML(metric.var, true, reverseColors)
            : '--';
    }
}

function setAeoSources(indicadores = {}) {
    const sourceElements = document.querySelectorAll('[data-aeo-source]');

    sourceElements.forEach(element => {
        const sourceKey = element.dataset.aeoSource;
        const metric = indicadores?.[sourceKey];

        element.textContent = metric ? formatValue(metric.val) : '--';
    });
}

export function updateKPIs(data) {
    if (!data) {
        setKpiCard('kpi-aeo', null);
        setKpiCard('kpi-seo', null);
        setKpiCard('kpi-competidores', null);
        setKpiCard('kpi-keywords-pautadas', null);
        setKpiCard('kpi-cantidad-keywords', null);
        setAeoSources({});
        lucide.createIcons();
        return;
    }

    setKpiCard('kpi-aeo', data?.indicadores?.posicion_aeo);
    setAeoSources(data?.indicadores || {});
    setKpiCard('kpi-seo', data?.indicadores?.posicion_seo);
    setKpiCard('kpi-competidores', data?.indicadores?.competidores);
    setKpiCard('kpi-keywords-pautadas', data?.indicadores?.keywords_pautadas_competencia);
    setKpiCard('kpi-cantidad-keywords', data?.indicadores?.cantidad_keywords);

    lucide.createIcons();
}