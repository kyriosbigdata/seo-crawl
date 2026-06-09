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

function getQueryHeaders(metric) {
    const configs = {
        clicks: ['Query', 'Clicks Last Period', 'Clicks Prev Period', 'Clicks Delta'],
        impressions: ['Query', 'Impr. Last Period', 'Impr. Prev Period', 'Impr. Delta'],
        position: ['Query', 'Position Last Period', 'Position Prev Period', 'Position Delta']
    };

    return configs[metric] || configs.clicks;
}

function getQuerySortableFields(metric) {
    const configs = {
        clicks: [null, 'clicks_last_period', 'clicks_prev_period', 'clicks_delta'],
        impressions: [null, 'impressions_last_period', 'impressions_prev_period', 'impressions_delta'],
        position: [null, 'position_last_period', 'position_prev_period', 'position_delta']
    };

    return configs[metric] || configs.clicks;
}

function getQueryFilterField(metric) {
    const configs = {
        clicks: 'clicks_last_period',
        impressions: 'impressions_last_period',
        position: 'position_last_period'
    };

    return configs[metric] || configs.clicks;
}

const queryCsvColumns = [
    { key: 'fecha_ref', label: 'Fecha' },
    { key: 'category', label: 'Categoría' },
    { key: 'query', label: 'Query' },
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

function getQueryRowMarkup(row, metric) {
    const configs = {
        clicks: `
            <td>${row.query || '--'}</td>
            <td>${formatValue(row.clicks_last_period)}</td>
            <td>${formatValue(row.clicks_prev_period)}</td>
            <td>${formatDeltaCell(row.clicks_delta)}</td>
        `,
        impressions: `
            <td>${row.query || '--'}</td>
            <td>${formatValue(row.impressions_last_period)}</td>
            <td>${formatValue(row.impressions_prev_period)}</td>
            <td>${formatDeltaCell(row.impressions_delta)}</td>
        `,
        position: `
            <td>${row.query || '--'}</td>
            <td>${formatValue(row.position_last_period)}</td>
            <td>${formatValue(row.position_prev_period)}</td>
            <td>${formatDeltaCell(row.position_delta)}</td>
        `
    };

    return configs[metric] || configs.clicks;
}

function getProcessedQueryRows({
    queriesData,
    selectedDate,
    activeMetric,
    activeSortKey,
    queryFilterController,
    queryTextFilterController
}) {
    const filterField = getQueryFilterField(activeMetric);

    const rows = queriesData.filter(item => item.fecha_ref === selectedDate);
    const textFilteredRows = filterRowsByTextKey(rows, 'query', queryTextFilterController);
    const filteredRows = filterRowsByKey(textFilteredRows, filterField, queryFilterController);
    const sortedRows = sortRowsByKey(filteredRows, activeSortKey);

    return sortedRows;
}

export function downloadQueriesCsv({
    queriesData,
    selectedDate,
    queryMetricController,
    querySortController = null,
    queryFilterController = null,
    queryTextFilterController = null
}) {
    const activeMetric = queryMetricController?.getActiveMetric?.() || 'clicks';
    const activeSortKey = querySortController?.getActiveSortKey?.() || null;

    const rows = getProcessedQueryRows({
        queriesData,
        selectedDate,
        activeMetric,
        activeSortKey,
        queryFilterController,
        queryTextFilterController
    });

    const csvContent = convertRowsToCsv(rows, queryCsvColumns);
    const fileName = `comparativo-queries-${selectedDate}.csv`;

    downloadCsv(fileName, csvContent);
}

export function renderQueriesTable(
    queriesData,
    selectedDate,
    queryMetricController,
    querySortController = null,
    queryPaginationController = null,
    queryFilterController = null,
    queryTextFilterController = null
) {
    const tbody = document.querySelector('#queryTable tbody');
    const headRow = document.getElementById('queryTableHeadRow');
    const paginationEl = document.getElementById('queryPagination');

    if (!tbody || !headRow) return;

    const activeMetric = queryMetricController?.getActiveMetric?.() || 'clicks';
    const activeSortKey = querySortController?.getActiveSortKey?.() || null;
    const sortedRows = getProcessedQueryRows({
        queriesData,
        selectedDate,
        activeMetric,
        activeSortKey,
        queryFilterController,
        queryTextFilterController
    });

    const visibleRows = getPaginatedRows(sortedRows, queryPaginationController);

    renderMetricTable({
        headRowElement: headRow,
        bodyElement: tbody,
        rows: visibleRows,
        metric: activeMetric,
        getHeaders: getQueryHeaders,
        getRowMarkup: getQueryRowMarkup,
        sortController: querySortController,
        getSortableFields: getQuerySortableFields
    });

    renderPaginationControls({
        containerElement: paginationEl,
        totalRows: sortedRows.length,
        paginationController: queryPaginationController
    });
}