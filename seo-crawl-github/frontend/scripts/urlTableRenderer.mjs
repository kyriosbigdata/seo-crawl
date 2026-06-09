import {
    formatValue,
    formatDeltaCell
} from './formatters.mjs';

import {
    renderMetricTable,
    sortRowsByKey,
    getPaginatedRows,
    renderPaginationControls,
    filterRowsByKey,
    filterRowsByTextKey,
    convertRowsToCsv,
    downloadCsv
} from './tableControls.mjs';

function getUrlHeaders(metric) {
    const configs = {
        clicks: ['URL', 'Clicks Last Period', 'Clicks Prev Period', 'Clicks Delta'],
        impressions: ['URL', 'Impr. Last Period', 'Impr. Prev Period', 'Impr. Delta'],
        position: ['URL', 'Position Last Period', 'Position Prev Period', 'Position Delta']
    };

    return configs[metric] || configs.clicks;
}

function getUrlSortableFields(metric) {
    const configs = {
        clicks: [null, 'clicks_last_period', 'clicks_prev_period', 'clicks_delta'],
        impressions: [null, 'impressions_last_period', 'impressions_prev_period', 'impressions_delta'],
        position: [null, 'position_last_period', 'position_prev_period', 'position_delta']
    };

    return configs[metric] || configs.clicks;
}

function getUrlFilterField(metric) {
    const configs = {
        clicks: 'clicks_last_period',
        impressions: 'impressions_last_period',
        position: 'position_last_period'
    };

    return configs[metric] || configs.clicks;
}
const urlCsvColumns = [
    { key: 'fecha_ref', label: 'Fecha' },
    { key: 'category', label: 'Categoría' },
    { key: 'url', label: 'URL' },
    { key: 'clicks_last_period', label: 'Clicks Last Period' },
    { key: 'clicks_prev_period', label: 'Clicks Prev Period' },
    { key: 'clicks_delta', label: 'Clicks Delta' },
    { key: 'impressions_last_period', label: 'Impressions Last Period' },
    { key: 'impressions_prev_period', label: 'Impressions Prev Period' },
    { key: 'impressions_delta', label: 'Impressions Delta' },
    { key: 'ctr_last_period', label: 'CTR Last Period' },
    { key: 'ctr_prev_period', label: 'CTR Prev Period' },
    { key: 'ctr_delta', label: 'CTR Delta' },
    { key: 'position_last_period', label: 'Position Last Period' },
    { key: 'position_prev_period', label: 'Position Prev Period' },
    { key: 'position_delta', label: 'Position Delta' }
];
function getUrlRowMarkup(row, metric) {
    const configs = {
        clicks: `
            <td>${row.url || '--'}</td>
            <td>${formatValue(row.clicks_last_period)}</td>
            <td>${formatValue(row.clicks_prev_period)}</td>
            <td>${formatDeltaCell(row.clicks_delta)}</td>
        `,
        impressions: `
            <td>${row.url || '--'}</td>
            <td>${formatValue(row.impressions_last_period)}</td>
            <td>${formatValue(row.impressions_prev_period)}</td>
            <td>${formatDeltaCell(row.impressions_delta)}</td>
        `,
        position: `
            <td>${row.url || '--'}</td>
            <td>${formatValue(row.position_last_period)}</td>
            <td>${formatValue(row.position_prev_period)}</td>
            <td>${formatDeltaCell(row.position_delta)}</td>
        `
    };

    return configs[metric] || configs.clicks;
}

function getProcessedUrlRows({
    urlsData,
    selectedDate,
    activeMetric,
    activeSortKey,
    urlFilterController,
    urlTextFilterController
}) {
    const filterField = getUrlFilterField(activeMetric);

    const rows = urlsData.filter(item => item.fecha_ref === selectedDate);
    const textFilteredRows = filterRowsByTextKey(rows, 'url', urlTextFilterController);
    const filteredRows = filterRowsByKey(textFilteredRows, filterField, urlFilterController);
    const sortedRows = sortRowsByKey(filteredRows, activeSortKey);

    return sortedRows;
}

export function downloadUrlsCsv({
    urlsData,
    selectedDate,
    urlMetricController,
    urlSortController = null,
    urlFilterController = null,
    urlTextFilterController = null
}) {
    const activeMetric = urlMetricController?.getActiveMetric?.() || 'clicks';
    const activeSortKey = urlSortController?.getActiveSortKey?.() || null;

    const rows = getProcessedUrlRows({
        urlsData,
        selectedDate,
        activeMetric,
        activeSortKey,
        urlFilterController,
        urlTextFilterController
    });

    const csvContent = convertRowsToCsv(rows, urlCsvColumns);
    const fileName = `comparativo-urls-${selectedDate}.csv`;

    downloadCsv(fileName, csvContent);
}

export function renderUrlsTable(
    urlsData,
    selectedDate,
    urlMetricController,
    urlSortController = null,
    urlPaginationController = null,
    urlFilterController = null,
    urlTextFilterController = null
) {
    const tbody = document.querySelector('#urlTable tbody');
    const headRow = document.getElementById('urlTableHeadRow');
    const paginationEl = document.getElementById('urlPagination');

    if (!tbody || !headRow) return;

    const activeMetric = urlMetricController?.getActiveMetric?.() || 'clicks';
    const activeSortKey = urlSortController?.getActiveSortKey?.() || null;
    const sortedRows = getProcessedUrlRows({
        urlsData,
        selectedDate,
        activeMetric,
        activeSortKey,
        urlFilterController,
        urlTextFilterController
    });

    const visibleRows = getPaginatedRows(sortedRows, urlPaginationController);

    renderMetricTable({
        headRowElement: headRow,
        bodyElement: tbody,
        rows: visibleRows,
        metric: activeMetric,
        getHeaders: getUrlHeaders,
        getRowMarkup: getUrlRowMarkup,
        sortController: urlSortController,
        getSortableFields: getUrlSortableFields
    });

    renderPaginationControls({
        containerElement: paginationEl,
        totalRows: sortedRows.length,
        paginationController: urlPaginationController
    });
}