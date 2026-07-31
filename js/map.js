/* ===== CONFIG ===== */
const API_BASE = 'https://script.google.com/macros/s/AKfycbwCgAj7ZEEiz0sS_lzlcp3_5HFEglkttR7dXdzITeyAwqK1xjHU_AJhHJEUbfs9jPAO/exec';
const AUTO_REFRESH_MS = 5000;
/* ================== */

function jsonp(action, params = {}) {
    return new Promise((resolve, reject) => {
        const cb = 'cb_' + Math.random().toString(36).slice(2);
        const qs = new URLSearchParams({ ...params, action, callback: cb }).toString();
        const url = API_BASE + (API_BASE.includes('?') ? '&' : '?') + qs;
        const s = document.createElement('script');
        s.src = url; s.async = true;
        window[cb] = (data) => { cleanup(); resolve(data); };
        s.onerror = () => { cleanup(); reject(new Error('JSONP load error')); };
        function cleanup() { try { delete window[cb]; } catch (_) { } s.remove(); }
        document.head.appendChild(s);
    });
}

const el = {
    status: document.getElementById('status'),
    statsContainer: document.getElementById('statsContainer'),
};

let data = { items: [] };

/* ===== Totals ===== */
function computeTotals(items) {
    const valid = items.filter(b => b.status !== '');
    const defused = valid.filter(b => b.locked || b.status === 'Defused').length;
    const active = valid.length - defused;
    return { active, defused };
}

function renderTotals(items) {
    const { active, defused } = computeTotals(items);
    el.statsContainer.innerHTML = `
    <div class="totals">
      <div class="common red">
        <p>Active</p>
        <p style="font-size: 32px;">${active}</p>
      </div>
      <div class="common green">
        <p>Defused</p>
        <p style="font-size: 32px;">${defused}</p>
      </div>
    </div>
  `;
}

function renderRefreshedTime() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const elRefresh = document.getElementById('lastRefresh');
    if (elRefresh) elRefresh.innerHTML = 'Last updated: ' + now.toLocaleTimeString('en-US', options);
}

/* ===== Render ===== */
function render() {
    renderTotals(data.items);
    renderRefreshedTime();
}

/* ===== Load ===== */
async function load() {
    try {
        const res = await jsonp('list', {});
        if (!res || !res.ok) throw new Error(res && res.message || 'Load error');
        data = res;
        render();
    } catch (e) {
        el.status.textContent = '⚠️ ' + e.message;
    }
}

load();
setInterval(load, AUTO_REFRESH_MS);
