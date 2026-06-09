import {
    formatValue,
    formatMonthLabel
} from './formatters.mjs';

let trafficChart = null;
let conversionsChart = null;
let funnelChart = null;

export function renderCharts(resumenData, resumenRow) {
    const orderedResumen = [...resumenData].sort((a, b) => new Date(a.fecha_ref) - new Date(b.fecha_ref));

    const trafficSeries = orderedResumen.map(item => {
        return item?.graficos?.trafico_organic_search?.[0] ?? 0;
    });

    const conversionsSeries = orderedResumen.map(item => {
        return item?.graficos?.conversiones_organic_search?.[0] ?? 0;
    });

    const monthLabels = orderedResumen.map(item => formatMonthLabel(item.fecha_ref));

    const conversionsOptions = {
        chart: {
            type: 'bar',
            height: '100%',
            background: 'transparent',
            toolbar: { show: false }
        },
        series: [
            {
                name: 'Conversiones',
                data: conversionsSeries
            }
        ],
        dataLabels: { enabled: false },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '48%'
            }
        },
        colors: ['#ff4fd8'],
        grid: {
            borderColor: '#232323',
            strokeDashArray: 2
        },
        xaxis: {
            categories: monthLabels,
            labels: {
                style: {
                    colors: '#a3a3a3',
                    fontSize: '11px'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#a3a3a3',
                    fontSize: '11px'
                },
                formatter: value => formatValue(value)
            }
        },
        tooltip: { theme: 'dark' },
        legend: { show: false }
    };

    const funnelData = resumenRow?.graficos?.embudo_conversiones || {};

    const funnelOptions = {
        chart: {
            type: 'bar',
            height: '100%',
            background: 'transparent',
            toolbar: { show: false }
        },
        series: [
            {
                name: 'Embudo',
                data: [
                    funnelData.impresiones || 0,
                    funnelData.clics || 0,
                    funnelData.conversiones || 0
                ]
            }
        ],
        dataLabels: {
            enabled: true,
            formatter: value => formatValue(value),
            style: {
                fontSize: '11px',
                fontWeight: 600
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                distributed: true,
                barHeight: '55%'
            }
        },
        colors: ['#60a5fa', '#ff4fd8', '#a855f7'],
        grid: {
            borderColor: '#232323',
            strokeDashArray: 2
        },
        xaxis: {
            categories: ['Impresiones', 'Clics', 'Conversiones'],
            labels: {
                style: {
                    colors: '#a3a3a3',
                    fontSize: '11px'
                },
                formatter: value => formatValue(value)
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#e5e5e5',
                    fontSize: '11px'
                }
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: value => formatValue(value)
            }
        },
        legend: { show: false }
    };

    const trafficOptions = {
        chart: {
            type: 'line',
            height: '100%',
            background: 'transparent',
            toolbar: { show: false }
        },
        series: [
            {
                name: 'Tráfico',
                data: trafficSeries
            }
        ],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        colors: ['#ff4fd8'],
        grid: {
            borderColor: '#232323',
            strokeDashArray: 2
        },
        xaxis: {
            categories: monthLabels,
            labels: {
                style: {
                    colors: '#a3a3a3',
                    fontSize: '11px'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#a3a3a3',
                    fontSize: '11px'
                },
                formatter: value => formatValue(value)
            }
        },
        tooltip: { theme: 'dark' },
        legend: { show: false }
    };

    if (conversionsChart) conversionsChart.destroy();
    if (funnelChart) funnelChart.destroy();
    if (trafficChart) trafficChart.destroy();

    const conversionsEl = document.getElementById('conversionsChart');
    const funnelEl = document.getElementById('funnelChart');
    const trafficEl = document.getElementById('trafficChart');

    if (conversionsEl) {
        conversionsChart = new ApexCharts(conversionsEl, conversionsOptions);
        conversionsChart.render();
    }

    if (funnelEl) {
        funnelChart = new ApexCharts(funnelEl, funnelOptions);
        funnelChart.render();
    }

    if (trafficEl) {
        trafficChart = new ApexCharts(trafficEl, trafficOptions);
        trafficChart.render();
    }
}