const SERVER_URL = 'http://localhost:3001/api/analyze';

export async function renderAiAnalysis({ resumenData, selectedDate, urlsData, queriesData }) {
    const container = document.getElementById('aiAnalysis');
    if (!container) return;

    container.innerHTML = `
        <div class="ai-analysis-loading">
            <span class="ai-analysis-spinner"></span>
            <span>Analizando datos con IA...</span>
        </div>
    `;

    try {
        const contexto = buildContext({ resumenData, selectedDate, urlsData, queriesData });
        const analysis = await fetchAnalysis(contexto);
        renderResult(container, analysis, selectedDate);
    } catch (error) {
        console.error('Error en análisis IA:', error);
        container.innerHTML = `
            <div class="ai-analysis-error">
                No se pudo generar el análisis. Intenta nuevamente.
            </div>
        `;
    }
}

function buildContext({ resumenData, selectedDate, urlsData, queriesData }) {
    const resumenRow = resumenData.find(r => r.fecha_ref === selectedDate);

    const indicadores = resumenRow?.indicadores || {};
    const laterales = resumenRow?.laterales || {};

    const topUrls = [...(urlsData || [])]
        .filter(u => u.fecha_ref === selectedDate)
        .sort((a, b) => (b.clicks_last_period ?? 0) - (a.clicks_last_period ?? 0))
        .slice(0, 5)
        .map(u => ({
            url: u.url,
            clicks: u.clicks_last_period,
            impresiones: u.impressions_last_period,
            posicion: u.position_last_period
        }));

    const topQueries = [...(queriesData || [])]
        .filter(q => q.fecha_ref === selectedDate)
        .sort((a, b) => (b.clicks_last_period ?? 0) - (a.clicks_last_period ?? 0))
        .slice(0, 5)
        .map(q => ({
            query: q.query,
            clicks: q.clicks_last_period,
            impresiones: q.impressions_last_period,
            posicion: q.position_last_period
        }));

    return { fecha: selectedDate, indicadores, laterales, topUrls, topQueries };
}

async function fetchAnalysis(contexto) {
    const prompt = `
Eres un analista SEO experto. Analiza los siguientes datos del dashboard SEO del mes ${contexto.fecha} y genera un análisis ejecutivo en español.

INDICADORES PRINCIPALES:
${JSON.stringify(contexto.indicadores, null, 2)}

MÉTRICAS LATERALES:
${JSON.stringify(contexto.laterales, null, 2)}

TOP 5 URLs POR CLICKS:
${JSON.stringify(contexto.topUrls, null, 2)}

TOP 5 QUERIES POR CLICKS:
${JSON.stringify(contexto.topQueries, null, 2)}

Genera un análisis con esta estructura exacta en HTML (solo el contenido interno, sin html ni body):

<div class="ai-section">
  <h4>📊 Resumen ejecutivo</h4>
  <p>[2-3 oraciones sobre el estado general del mes]</p>
</div>

<div class="ai-section">
  <h4>📈 Tendencias destacadas</h4>
  <ul>
    <li>[tendencia 1]</li>
    <li>[tendencia 2]</li>
    <li>[tendencia 3]</li>
  </ul>
</div>

<div class="ai-section">
  <h4>⚠️ Alertas o puntos de atención</h4>
  <ul>
    <li>[alerta 1]</li>
    <li>[alerta 2]</li>
  </ul>
</div>

<div class="ai-section">
  <h4>✅ Recomendaciones accionables</h4>
  <ul>
    <li>[recomendación 1]</li>
    <li>[recomendación 2]</li>
    <li>[recomendación 3]</li>
  </ul>
</div>

Responde SOLO con el HTML, sin explicaciones ni bloques de código.
`;

    const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    return data.analysis || '';
}

function renderResult(container, htmlContent, selectedDate) {
    container.innerHTML = `
        <div class="ai-analysis-header">
            <span class="ai-analysis-icon">✦</span>
            <h3>Análisis IA — ${selectedDate}</h3>
            <button class="ai-refresh-btn" id="aiRefreshBtn" title="Regenerar análisis">
                <i data-lucide="refresh-cw"></i>
            </button>
        </div>
        <div class="ai-analysis-body">
            ${htmlContent}
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}