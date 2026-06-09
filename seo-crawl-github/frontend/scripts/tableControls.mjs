export function setupQueryMetricSwitch(onChange) {
    const container = document.getElementById('queryMetricSwitch');

    if (!container) {
        return {
            getActiveMetric: () => 'clicks'
        };
    }

    const buttons = Array.from(container.querySelectorAll('.query-metric-btn'));
    let activeMetric = 'clicks';

    const setActiveMetric = metric => {
        activeMetric = metric;

        buttons.forEach(button => {
            const isActive = button.dataset.metric === metric;
            button.classList.toggle('active', isActive);
        });

        if (typeof onChange === 'function') {
            onChange(metric);
        }
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveMetric(button.dataset.metric);
        });
    });

    setActiveMetric('clicks');

    return {
        getActiveMetric: () => activeMetric,
        setActiveMetric
    };
}

export function setupUrlMetricSwitch(onChange) {
    const container = document.getElementById('urlMetricSwitch');

    if (!container) {
        return {
            getActiveMetric: () => 'clicks'
        };
    }

    const buttons = Array.from(container.querySelectorAll('.url-metric-btn'));
    let activeMetric = 'clicks';

    const setActiveMetric = metric => {
        activeMetric = metric;

        buttons.forEach(button => {
            const isActive = button.dataset.metric === metric;
            button.classList.toggle('active', isActive);
        });

        if (typeof onChange === 'function') {
            onChange(metric);
        }
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveMetric(button.dataset.metric);
        });
    });

    setActiveMetric('clicks');

    return {
        getActiveMetric: () => activeMetric,
        setActiveMetric
    };
}

export function createTableSortController(onChange) {
    let activeSortKey = null;

    const setSortKey = sortKey => {
        activeSortKey = activeSortKey === sortKey ? null : sortKey;

        if (typeof onChange === 'function') {
            onChange(activeSortKey);
        }
    };

    return {
        getActiveSortKey: () => activeSortKey,
        setSortKey,
        resetSort: () => {
            activeSortKey = null;

            if (typeof onChange === 'function') {
                onChange(activeSortKey);
            }
        }
    };
}

export function sortRowsByKey(rows, sortKey) {
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
        const valueA = Number(a[sortKey] ?? 0);
        const valueB = Number(b[sortKey] ?? 0);

        return valueB - valueA;
    });
}

/* NUEVA LÓGICA DE FILTRO NUMÉRICO */

function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    const normalized = String(value).trim().replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
}

export function createTableValueFilterController(onChange) {
    let filterOperator = 'none';
    let filterValue = '';

    const notifyChange = () => {
        if (typeof onChange === 'function') {
            onChange({
                operator: filterOperator,
                value: filterValue
            });
        }
    };

    const setFilterOperator = operator => {
        filterOperator = operator || 'none';

        if (filterOperator === 'none') {
            filterValue = '';
        }

        notifyChange();
    };

    const setFilterValue = value => {
        filterValue = value ?? '';
        notifyChange();
    };

    const resetFilter = () => {
        filterOperator = 'none';
        filterValue = '';
        notifyChange();
    };

    return {
        getFilterOperator: () => filterOperator,
        getFilterValue: () => filterValue,
        setFilterOperator,
        setFilterValue,
        resetFilter
    };
}
export function filterRowsByKey(rows, filterKey, filterController) {
    if (!filterKey || !filterController) return rows;

    const operator = filterController.getFilterOperator?.() || 'none';
    const rawFilterValue = filterController.getFilterValue?.() ?? '';

    if (operator === 'none' || rawFilterValue === '') {
        return rows;
    }

    const filterValue = toNumber(rawFilterValue);

    return rows.filter(row => {
        const rowValue = toNumber(row[filterKey]);

        if (operator === 'gt') return rowValue > filterValue;
        if (operator === 'gte') return rowValue >= filterValue;
        if (operator === 'lt') return rowValue < filterValue;
        if (operator === 'lte') return rowValue <= filterValue;
        if (operator === 'eq') return rowValue === filterValue;

        return true;
    });
}

/* LÓGICA DE FILTRO DE TEXTO */

function normalizeText(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}

export function createTableTextFilterController(onChange) {
    let filterOperator = 'none';
    let filterValue = '';
    let filterTerms = [];

    const notifyChange = () => {
        if (typeof onChange === 'function') {
            onChange({
                operator: filterOperator,
                value: filterValue,
                terms: filterTerms
            });
        }
    };

    const setFilterOperator = operator => {
        filterOperator = operator || 'none';

        if (filterOperator === 'none') {
            filterValue = '';
            filterTerms = [];
        }

        notifyChange();
    };

    const setFilterValue = value => {
        filterValue = value ?? '';
        notifyChange();
    };

    const addFilterTerm = term => {
        const cleanTerm = String(term ?? '').trim();

        if (!cleanTerm) return;

        const normalizedTerm = normalizeText(cleanTerm);
        const alreadyExists = filterTerms.some(item => {
            return normalizeText(item) === normalizedTerm;
        });

        if (alreadyExists) {
            filterValue = '';
            notifyChange();
            return;
        }

        filterTerms = [...filterTerms, cleanTerm];
        filterValue = '';
        notifyChange();
    };

    const removeFilterTerm = termToRemove => {
        const normalizedTermToRemove = normalizeText(termToRemove);

        filterTerms = filterTerms.filter(term => {
            return normalizeText(term) !== normalizedTermToRemove;
        });

        notifyChange();
    };

    const clearFilterTerms = () => {
        filterTerms = [];
        notifyChange();
    };

    const resetFilter = () => {
        filterOperator = 'none';
        filterValue = '';
        filterTerms = [];
        notifyChange();
    };

    return {
        getFilterOperator: () => filterOperator,
        getFilterValue: () => filterValue,
        getFilterTerms: () => filterTerms,
        setFilterOperator,
        setFilterValue,
        addFilterTerm,
        removeFilterTerm,
        clearFilterTerms,
        resetFilter
    };
}
export function filterRowsByTextKey(rows, filterKey, filterController) {
    if (!filterKey || !filterController) return rows;

    const operator = filterController.getFilterOperator?.() || 'none';
    const rawFilterValue = filterController.getFilterValue?.() ?? '';
    const controllerTerms = filterController.getFilterTerms?.() || [];

    if (operator === 'none') {
        return rows;
    }

    if (rawFilterValue.trim() === '' && !controllerTerms.length) {
        return rows;
    }

    const filterValue = normalizeText(rawFilterValue);

    return rows.filter(row => {
        const rowValue = normalizeText(row[filterKey]);

        if (operator === 'contains') {
            return rowValue.includes(filterValue);
        }

        if (operator === 'exact') {
            return rowValue === filterValue;
        }

        if (operator === 'containsAny') {
            const controllerTerms = filterController.getFilterTerms?.() || [];

            const termsFromChips = controllerTerms
                .map(term => normalizeText(term))
                .filter(Boolean);

            const termsFromInput = filterValue
                .split('|')
                .map(term => normalizeText(term))
                .filter(Boolean);

            const terms = [...termsFromChips, ...termsFromInput];

            if (!terms.length) return true;

            return terms.some(term => rowValue.includes(term));
        }

        return true;
    });
}

export function renderTextFilterControls({
    containerElement,
    filterController,
    label = 'Texto'
}) {
    if (!containerElement || !filterController) return;

    const activeOperator = filterController.getFilterOperator?.() || 'none';
    const activeValue = filterController.getFilterValue?.() ?? '';

    containerElement.innerHTML = `
        <div class="table-value-filter">
            <span class="table-value-filter__label">${label}</span>

<select class="table-value-filter__select">
    <option value="none" ${activeOperator === 'none' ? 'selected' : ''}>Sin filtro</option>
    <option value="contains" ${activeOperator === 'contains' ? 'selected' : ''}>Contiene</option>
    <option value="exact" ${activeOperator === 'exact' ? 'selected' : ''}>Coincide exactamente</option>
    <option value="containsAny" ${activeOperator === 'containsAny' ? 'selected' : ''}>Contiene cualquiera</option>
</select>

            <input
                type="text"
                class="table-value-filter__input table-value-filter__input--text"
placeholder="${activeOperator === 'containsAny' ? 'Separar con |' : 'Buscar'}"
                value="${activeValue}"
                ${activeOperator === 'none' ? 'disabled' : ''}
            />

${activeOperator === 'containsAny' ? `
    <div class="table-filter-chips">
        ${(filterController.getFilterTerms?.() || []).map(term => `
            <span class="table-filter-chip">
                ${term}
                <button
                    type="button"
                    class="table-filter-chip__remove"
                    data-term="${term}"
                    aria-label="Quitar ${term}"
                >
                    ×
                </button>
            </span>
        `).join('')}
    </div>
` : ''}

        </div>
    `;

    const select = containerElement.querySelector('.table-value-filter__select');
    const input = containerElement.querySelector('.table-value-filter__input');

    if (select) {
        select.addEventListener('change', event => {
            filterController.setFilterOperator(event.target.value);

            renderTextFilterControls({
                containerElement,
                filterController,
                label
            });
        });
    }

    if (input) {
        let debounceTimer = null;

        input.addEventListener('input', event => {
            const value = event.target.value;

            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                filterController.setFilterValue(value);
            }, 400);
        });

        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;

            const value = event.target.value.trim();

            if (!value) return;

            if (filterController.getFilterOperator?.() === 'containsAny') {
                event.preventDefault();

                clearTimeout(debounceTimer);

                filterController.addFilterTerm?.(value);

                renderTextFilterControls({
                    containerElement,
                    filterController,
                    label
                });
            }
        });
    }
    const removeButtons = Array.from(
        containerElement.querySelectorAll('.table-filter-chip__remove')
    );

    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const term = button.dataset.term;

            filterController.removeFilterTerm?.(term);

            renderTextFilterControls({
                containerElement,
                filterController,
                label
            });
        });
    });
}

export function renderValueFilterControls({
    containerElement,
    filterController,
    label = 'Filtro'
}) {
    if (!containerElement || !filterController) return;

    const activeOperator = filterController.getFilterOperator?.() || 'none';
    const activeValue = filterController.getFilterValue?.() ?? '';

    containerElement.innerHTML = `
        <div class="table-value-filter">
            <span class="table-value-filter__label">${label}</span>

            <select class="table-value-filter__select">
                <option value="none" ${activeOperator === 'none' ? 'selected' : ''}>Sin filtro</option>
                <option value="gt" ${activeOperator === 'gt' ? 'selected' : ''}>Mayor que</option>
                <option value="gte" ${activeOperator === 'gte' ? 'selected' : ''}>Mayor o igual que</option>
                <option value="lt" ${activeOperator === 'lt' ? 'selected' : ''}>Menor que</option>
                <option value="lte" ${activeOperator === 'lte' ? 'selected' : ''}>Menor o igual que</option>
                <option value="eq" ${activeOperator === 'eq' ? 'selected' : ''}>Igual a</option>
            </select>

            <input
                type="number"
                class="table-value-filter__input"
                placeholder="Valor"
                value="${activeValue}"
                ${activeOperator === 'none' ? 'disabled' : ''}
            />
        </div>
    `;

    const select = containerElement.querySelector('.table-value-filter__select');
    const input = containerElement.querySelector('.table-value-filter__input');

    if (select) {
        select.addEventListener('change', event => {
            filterController.setFilterOperator(event.target.value);
        });
    }

    if (input) {
        input.addEventListener('input', event => {
            filterController.setFilterValue(event.target.value);
        });
    }
}

export function createPaginationController(onChange, options = {}) {
    const { pageSize = 20 } = options;

    let currentPage = 1;

    const setPage = page => {
        currentPage = Math.max(1, Number(page) || 1);

        if (typeof onChange === 'function') {
            onChange(currentPage);
        }
    };

    const resetPage = () => {
        currentPage = 1;

        if (typeof onChange === 'function') {
            onChange(currentPage);
        }
    };

    return {
        getCurrentPage: () => currentPage,
        getPageSize: () => pageSize,
        setPage,
        resetPage
    };
}

export function getPaginatedRows(rows, paginationController) {
    if (!paginationController) return rows;

    const currentPage = paginationController.getCurrentPage();
    const pageSize = paginationController.getPageSize();

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return rows.slice(startIndex, endIndex);
}

export function getTotalPages(rows, paginationController) {
    if (!paginationController) return 1;

    const pageSize = paginationController.getPageSize();
    return Math.max(1, Math.ceil(rows.length / pageSize));
}

function getPaginationItems(currentPage, totalPages) {
    const items = [];

    if (totalPages <= 7) {
        for (let page = 1; page <= totalPages; page++) {
            items.push(page);
        }

        return items;
    }

    items.push(1);

    if (currentPage > 4) {
        items.push('...');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let page = startPage; page <= endPage; page++) {
        items.push(page);
    }

    if (currentPage < totalPages - 3) {
        items.push('...');
    }

    items.push(totalPages);

    return items;
}

export function renderPaginationControls({
    containerElement,
    totalRows,
    paginationController
}) {
    if (!containerElement || !paginationController) return;

    const currentPage = paginationController.getCurrentPage();
    const pageSize = paginationController.getPageSize();
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const paginationItems = getPaginationItems(currentPage, totalPages);

    const startItem = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalRows);

    containerElement.innerHTML = `
        <div class="table-pagination__info">
            ${startItem}-${endItem} de ${totalRows}
        </div>

        <div class="table-pagination__controls">
            <button
                type="button"
                class="table-pagination__btn"
                data-page="${currentPage - 1}"
                ${currentPage === 1 ? 'disabled' : ''}
            >
                Anterior
            </button>

            ${paginationItems.map(item => {
        if (item === '...') {
            return `<span class="table-pagination__ellipsis">...</span>`;
        }

        return `
                    <button
                        type="button"
                        class="table-pagination__btn ${item === currentPage ? 'active' : ''}"
                        data-page="${item}"
                    >
                        ${item}
                    </button>
                `;
    }).join('')}

            <button
                type="button"
                class="table-pagination__btn"
                data-page="${currentPage + 1}"
                ${currentPage === totalPages ? 'disabled' : ''}
            >
                Siguiente
            </button>
        </div>
    `;

    const buttons = Array.from(containerElement.querySelectorAll('.table-pagination__btn'));

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;

            const nextPage = Number(button.dataset.page);
            paginationController.setPage(nextPage);
        });
    });
}

export function renderMetricTable({
    headRowElement,
    bodyElement,
    rows,
    metric,
    getHeaders,
    getRowMarkup,
    sortController = null,
    getSortableFields = null
}) {
    if (!headRowElement || !bodyElement) return;

    const headers = getHeaders(metric) || [];
    const sortableFields = typeof getSortableFields === 'function'
        ? getSortableFields(metric)
        : [];

    const activeSortKey = sortController?.getActiveSortKey?.() || null;

    headRowElement.innerHTML = headers.map((header, index) => {
        const sortKey = sortableFields[index] || null;
        const isSortable = Boolean(sortKey);
        const isActive = activeSortKey === sortKey;

        if (!isSortable) {
            return `<th>${header}</th>`;
        }

        return `
            <th>
                <button
                    type="button"
                    class="table-sort-btn ${isActive ? 'active' : ''}"
                    data-sort-key="${sortKey}"
                >
                    <span>${header}</span>
                    <span class="table-sort-indicator">${isActive ? '↓' : ''}</span>
                </button>
            </th>
        `;
    }).join('');

    if (sortController) {
        const sortButtons = Array.from(headRowElement.querySelectorAll('.table-sort-btn'));

        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                sortController.setSortKey(button.dataset.sortKey);
            });
        });
    }

    bodyElement.innerHTML = rows.map(row => `
        <tr>
            ${getRowMarkup(row, metric)}
        </tr>
    `).join('');
}

/* LÓGICA DE DESCARGA CSV */

function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);
    const escapedValue = stringValue.replaceAll('"', '""');

    return `"${escapedValue}"`;
}

export function convertRowsToCsv(rows, columns) {
    const headers = columns.map(column => escapeCsvValue(column.label)).join(',');

    const body = rows.map(row => {
        return columns
            .map(column => escapeCsvValue(row[column.key]))
            .join(',');
    }).join('\n');

    return [headers, body].filter(Boolean).join('\n');
}

export function downloadCsv(fileName, csvContent) {
    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
}