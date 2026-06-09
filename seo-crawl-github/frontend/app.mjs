import {
    loadDashboardData,
    loadMonthlyDashboardData
} from './scripts/dataLoader.mjs';

import {
    dashboardCategories,
    getDefaultCategory,
    getCategoryById
} from './config/categories.mjs';

import {
    renderSidebarNav
} from './navigation/sidebarNav.mjs';

import {
    formatMonthLabel
} from './scripts/formatters.mjs';
import { renderAiAnalysis } from './scripts/aiAnalysisRenderer.mjs';
import { updateKPIs } from './scripts/kpiRenderer.mjs';
import { updateSidebar } from './scripts/sidebarRenderer.mjs';
import { renderCharts } from './scripts/chartRenderer.mjs';
import {
    renderUrlsTable,
    downloadUrlsCsv
} from './scripts/urlTableRenderer.mjs';

import {
    renderQueriesTable,
    downloadQueriesCsv
} from './scripts/queryTableRenderer.mjs';

import {
    setupQueryMetricSwitch,
    setupUrlMetricSwitch,
    createTableSortController,
    createPaginationController,
    createTableValueFilterController,
    renderValueFilterControls,
    createTableTextFilterController,
    renderTextFilterControls
} from './scripts/tableControls.mjs';

import {
    getAvailableDates,
    getResumenRowByDate
} from './scripts/dataSelectors.mjs';

let activeCategory = getDefaultCategory();

let resumenData = [];
let urlsData = [];
let queriesData = [];

let queryMetricController = null;
let urlMetricController = null;
let querySortController = null;
let urlSortController = null;
let queryPaginationController = null;
let urlPaginationController = null;
let queryFilterController = null;
let urlFilterController = null;
let queryTextFilterController = null;
let urlTextFilterController = null;
let controlsInitialized = false;

async function initApp() {
    try {
        renderNavigation();

        const data = await loadDashboardData(activeCategory.dataBasePath);

        resumenData = data.resumenData;
        urlsData = [];
        queriesData = [];

        initDashboard();
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
    }
}

function initDashboard() {
    if (!controlsInitialized) {
        setupQueryControls();
        setupUrlControls();
        setupSortControls();
        setupPaginationControls();
        setupValueFilterControls();
        setupTextFilterControls();
        setupAiAnalysisButton();
        setupDownloadControls();
        setupMonthSelectorChange();

        controlsInitialized = true;
    }

    populateMonthSelector();

    const fechas = getAvailableDates({
        resumenData,
        urlsData: [],
        queriesData: []
    });

    if (fechas.length) {
        const selector = document.getElementById('monthSelector');
        if (selector) {
            selector.value = fechas[fechas.length - 1];
        }

        loadAndUpdateDashboard(fechas[fechas.length - 1]);
    }
}

function setupMonthSelectorChange() {
    const selector = document.getElementById('monthSelector');
    if (!selector) return;

    selector.addEventListener('change', async event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;

        await loadAndUpdateDashboard(selectedDate);
    });
}

function populateMonthSelector() {
    const selector = document.getElementById('monthSelector');
    if (!selector) return;

    const fechas = getAvailableDates({
        resumenData,
        urlsData: [],
        queriesData: []
    });

    selector.innerHTML = '<option value="">Seleccionar Mes...</option>';

    fechas.forEach(fecha => {
        const option = document.createElement('option');
        option.value = fecha;
        option.textContent = formatMonthLabel(fecha);
        selector.appendChild(option);
    });
}

async function loadAndUpdateDashboard(selectedDate) {
    try {
        urlPaginationController?.resetPage?.();
        queryPaginationController?.resetPage?.();
        urlSortController?.resetSort?.();
        querySortController?.resetSort?.();
        urlFilterController?.resetFilter?.();
        queryFilterController?.resetFilter?.();

        const monthlyData = await loadMonthlyDashboardData(
            activeCategory.dataBasePath,
            selectedDate
        );

        urlsData = monthlyData.urlsData;
        queriesData = monthlyData.queriesData;

        updateDashboard(selectedDate);
        renderFilterControls();
    } catch (error) {
        console.error('Error cargando datos mensuales:', error);

        urlsData = [];
        queriesData = [];

        updateDashboard(selectedDate);
        renderFilterControls();
    }
}

function setupQueryControls() {
    queryMetricController = setupQueryMetricSwitch(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            queryPaginationController?.resetPage?.();

            renderQueriesTable(
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryPaginationController,
                queryFilterController,
                queryTextFilterController
            );
        }
    });
}

function setupUrlControls() {
    urlMetricController = setupUrlMetricSwitch(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            urlPaginationController?.resetPage?.();

            renderUrlsTable(
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlPaginationController,
                urlFilterController,
                urlTextFilterController
            );
        }
    });
}

function updateDashboard(selectedDate) {
    const resumenRow = getResumenRowByDate(resumenData, selectedDate);


    updateKPIs(resumenRow);
    updateSidebar(resumenRow?.laterales || {});
    renderCharts(resumenData, resumenRow);

    renderUrlsTable(
        urlsData,
        selectedDate,
        urlMetricController,
        urlSortController,
        urlPaginationController,
        urlFilterController,
        urlTextFilterController
    );

    renderQueriesTable(
        queriesData,
        selectedDate,
        queryMetricController,
        querySortController,
        queryPaginationController,
        queryFilterController,
        queryTextFilterController
    );
}

function setupSortControls() {
    urlSortController = createTableSortController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            urlPaginationController?.resetPage?.();

            renderUrlsTable(
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlPaginationController,
                urlFilterController,
                urlTextFilterController
            );
        }
    });

    querySortController = createTableSortController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            queryPaginationController?.resetPage?.();

            renderQueriesTable(
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryPaginationController,
                queryFilterController,
                queryTextFilterController
            );
        }
    });
}

function setupPaginationControls() {
    urlPaginationController = createPaginationController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            renderUrlsTable(
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlPaginationController,
                urlFilterController,
                urlTextFilterController
            );
        }
    }, { pageSize: 20 });

    queryPaginationController = createPaginationController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            renderQueriesTable(
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryPaginationController,
                queryFilterController,
                queryTextFilterController
            );
        }
    }, { pageSize: 20 });
}

function setupValueFilterControls() {
    urlFilterController = createTableValueFilterController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            urlPaginationController?.resetPage?.();

            renderUrlsTable(
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlPaginationController,
                urlFilterController,
                urlTextFilterController
            );

            renderFilterControls();
        }
    });

    queryFilterController = createTableValueFilterController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            queryPaginationController?.resetPage?.();

            renderQueriesTable(
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryPaginationController,
                queryFilterController,
                queryTextFilterController
            );

            renderFilterControls();
        }
    });

    renderFilterControls();
}

function setupTextFilterControls() {
    urlTextFilterController = createTableTextFilterController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            urlPaginationController?.resetPage?.();

            renderUrlsTable(
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlPaginationController,
                urlFilterController,
                urlTextFilterController
            );

        }
    });

    queryTextFilterController = createTableTextFilterController(() => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (selectedDate) {
            queryPaginationController?.resetPage?.();

            renderQueriesTable(
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryPaginationController,
                queryFilterController,
                queryTextFilterController
            );


        }
    });

    renderFilterControls();
}

function renderFilterControls() {
    renderValueFilterControls({
        containerElement: document.getElementById('urlValueFilter'),
        filterController: urlFilterController,
        label: 'Filtro métrica'
    });

    renderTextFilterControls({
        containerElement: document.getElementById('urlTextFilter'),
        filterController: urlTextFilterController,
        label: 'Filtro URL'
    });

    renderValueFilterControls({
        containerElement: document.getElementById('queryValueFilter'),
        filterController: queryFilterController,
        label: 'Filtro métrica'
    });

    renderTextFilterControls({
        containerElement: document.getElementById('queryTextFilter'),
        filterController: queryTextFilterController,
        label: 'Filtro Query'
    });
}

function setupAiAnalysisButton() {
    const btn = document.getElementById('aiAnalyzeBtn');
    const overlay = document.getElementById('aiModalOverlay');
    const closeBtn = document.getElementById('aiModalClose');

    if (!btn) return;

    btn.addEventListener('click', () => {
        const selector = document.getElementById('monthSelector');
        const selectedDate = selector?.value;

        if (!selectedDate) {
            alert('Selecciona un mes primero');
            return;
        }

        const title = document.getElementById('aiModalTitle');
        if (title) title.textContent = `Análisis IA — ${selectedDate}`;

        overlay.style.display = 'flex';
        renderAiAnalysis({ resumenData, selectedDate, urlsData, queriesData });
    });

    closeBtn?.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
    });
}

function setupDownloadControls() {
    const urlDownloadButton = document.getElementById('downloadUrlsCsv');
    const queryDownloadButton = document.getElementById('downloadQueriesCsv');

    if (urlDownloadButton) {
        urlDownloadButton.addEventListener('click', () => {
            const selector = document.getElementById('monthSelector');
            const selectedDate = selector?.value;

            if (!selectedDate) return;

            downloadUrlsCsv({
                urlsData,
                selectedDate,
                urlMetricController,
                urlSortController,
                urlFilterController,
                urlTextFilterController
            });
        });
    }

    if (queryDownloadButton) {
        queryDownloadButton.addEventListener('click', () => {
            const selector = document.getElementById('monthSelector');
            const selectedDate = selector?.value;

            if (!selectedDate) return;

            downloadQueriesCsv({
                queriesData,
                selectedDate,
                queryMetricController,
                querySortController,
                queryFilterController,
                queryTextFilterController
            });
        });
    }
}

/* NUEVAS FUNCIONES DE NAVEGACIÓN */

function renderNavigation() {
    renderSidebarNav({
        categories: dashboardCategories,
        activeCategoryId: activeCategory.id,
        onCategoryChange: handleCategoryChange
    });
}

async function handleCategoryChange(categoryId) {
    const nextCategory = getCategoryById(categoryId);

    if (!nextCategory || nextCategory.id === activeCategory.id) return;

    activeCategory = nextCategory;

    resumenData = [];
    urlsData = [];
    queriesData = [];

    urlPaginationController?.resetPage?.();
    queryPaginationController?.resetPage?.();
    urlSortController?.resetSort?.();
    querySortController?.resetSort?.();
    urlFilterController?.resetFilter?.();
    queryFilterController?.resetFilter?.();

    const selector = document.getElementById('monthSelector');
    if (selector) {
        selector.innerHTML = '<option value="">Seleccionar Mes...</option>';
    }

    renderNavigation();

    try {
        const data = await loadDashboardData(activeCategory.dataBasePath);

        resumenData = data.resumenData;
        urlsData = [];
        queriesData = [];

        initDashboard();
        renderFilterControls();
    } catch (error) {
        console.error('Error cambiando de categoría:', error);
    }
}

function initBrandBackgroundAnimation() {
    const brandCard = document.getElementById('kpi-brand');
    const gsapInstance = window.gsap;

    if (!brandCard || !gsapInstance) return;

    const background = brandCard.querySelector('.brand-animated-bg');
    const blobs = brandCard.querySelectorAll('.brand-blob');

    if (!background || !blobs.length) return;

    gsapInstance.set(background, {
        transformOrigin: '50% 50%',
        scale: 1.15,
        rotation: 0
    });

    gsapInstance.to(background, {
        x: 55,
        y: -35,
        scale: 1.28,
        rotation: 14,
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });

    gsapInstance.to('.brand-blob-1', {
        x: 90,
        y: 45,
        scale: 1.45,
        opacity: 0.95,
        duration: 4.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });

    gsapInstance.to('.brand-blob-2', {
        x: -85,
        y: 65,
        scale: 1.55,
        opacity: 0.85,
        duration: 5.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });

    gsapInstance.to('.brand-blob-3', {
        x: 70,
        y: -95,
        scale: 1.35,
        opacity: 0.8,
        duration: 7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });

    gsapInstance.to('.brand-blob-4', {
        x: -60,
        y: -55,
        scale: 1.5,
        opacity: 0.75,
        duration: 4.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initBrandBackgroundAnimation();
    initApp();
});