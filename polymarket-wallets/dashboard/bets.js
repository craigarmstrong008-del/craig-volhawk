(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NAMES = { top20: 'Copy the top 20', slow20: 'Slow top 20', consensus: 'Consensus of 3+', fade20: 'Fade the bottom 20' };
  const name = (id) => NAMES[id] || id;
  const usd = (x) => `${x < 0 ? '−' : ''}$${Math.abs(x).toFixed(2)}`;
  const signed = (x) => (x == null ? '—' : `<span class="${x > 0.005 ? 'up' : x < -0.005 ? 'down' : ''}">${x > 0.005 ? '+' : ''}${usd(x)}</span>`);
  const cents = (p) => (p == null ? '—' : `${(p * 100).toFixed(p < 0.1 || p > 0.9 ? 1 : 0)}¢`);
  const pct = (x) => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
  const ago = (ts) => {
    if (!ts) return '—';
    const s = Date.now() / 1000 - ts;
    if (s < 90) return 'just now';
    if (s < 5400) return `${Math.round(s / 60)} min ago`;
    if (s < 172800) return `${Math.round(s / 3600)} h ago`;
    return `${Math.round(s / 86400)} days ago`;
  };
  const lag = (s) => (s < 120 ? `${s}s` : s < 7200 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);
  const link = (p) => (p.eventSlug || p.slug ? `https://polymarket.com/event/${encodeURIComponent(p.eventSlug || p.slug)}` : null);
  const plOf = (p) => (p.status === 'open' ? (p.mark != null ? p.shares * p.mark - p.cost : null) : p.pnl);

  let filter = 'all';
  try { filter = localStorage.getItem('pmw-bets-filter') || 'all'; } catch {}
  const shown = { open: 30, settled: 30 };

  function card(p) {
    const pl = plOf(p);
    const url = link(p);
    const title = url ? `<a class="title" href="${url}" target="_blank" rel="noopener">${esc(p.title || 'Untitled market')}</a>` : `<span class="title">${esc(p.title || 'Untitled market')}</span>`;
    const state = p.status === 'open'
      ? `<span class="state open">Open${p.mark != null ? ` · now ${cents(p.mark)}` : ''}</span>`
      : `<span class="state ${esc(p.status)}">${p.status === 'won' ? '✓ Won' : p.status === 'lost' ? '✕ Lost' : 'Void'}</span>`;
    return `<article class="bet">
      <div class="row">${title}<span class="pl">${signed(pl)}</span></div>
      <div class="row"><span class="meta"><b>${esc(p.outcome)}</b><span>${esc(name(p.strategy))}</span></span>${state}</div>
      <div class="meta"><span>Paid <b>${cents(p.entry)}</b> vs their ${cents(p.theirPrice)}</span><span>${lag(p.lagSec)} after them</span><span>${ago(p.detectedAt)}</span>${p.wallets?.length > 1 ? `<span>${p.wallets.length} wallets</span>` : ''}</div>
    </article>`;
  }

  function list(el, items, key) {
    const n = shown[key];
    el.innerHTML = items.length
      ? items.slice(0, n).map(card).join('') + (items.length > n ? `<button class="btn more" data-more="${key}">Show ${Math.min(30, items.length - n)} more</button>` : '')
      : `<p class="none">${key === 'open' ? 'No open bets.' : 'Nothing has settled yet. Bets settle when their market resolves.'}</p>`;
    el.querySelector('[data-more]')?.addEventListener('click', () => { shown[key] += 30; render(); });
  }

  function render() {
    const P = window.PAPER;
    if (!P || !P.summary) {
      $('#meta').textContent = 'Waiting for the agent’s first report.';
      $('#empty').hidden = false;
      return;
    }
    const fresh = Date.now() / 1000 - (P.updatedAt || 0) < 45 * 60;
    const status = $('#status');
    status.hidden = false;
    status.className = `pill ${fresh ? 'live' : 'idle'}`;
    status.textContent = fresh ? 'Agent running' : 'Agent between runs';
    $('#meta').textContent = `Updated ${ago(P.updatedAt)} · $${P.stake} per bet · checks for new results every minute`;

    const ids = Object.keys(P.summary);
    $('#chips').innerHTML = ['all', ...ids].map((id) => `<button type="button" data-f="${esc(id)}" aria-pressed="${filter === id}">${id === 'all' ? 'All strategies' : esc(name(id))}</button>`).join('');
    $('#chips').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.f; shown.open = shown.settled = 30;
      try { localStorage.setItem('pmw-bets-filter', filter); } catch {}
      render();
    }));

    const pos = (P.positions || []).filter((p) => filter === 'all' || p.strategy === filter);
    const open = pos.filter((p) => p.status === 'open');
    const settled = pos.filter((p) => p.status !== 'open').sort((a, b) => (b.settledAt || 0) - (a.settledAt || 0));
    const rows = filter === 'all' ? Object.values(P.summary) : [P.summary[filter]].filter(Boolean);
    const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
    const staked = sum('staked'), realised = sum('realised'), won = sum('won'), settledN = sum('settled');
    $('#empty').hidden = sum('bets') > 0;

    const tile = (l, v, s) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
    $('#kpis').innerHTML = [
      tile('Settled profit', signed(realised), staked ? `${pct(realised / staked)} on $${staked.toFixed(0)} staked` : 'nothing settled yet'),
      tile('Open bets', String(sum('open')), `$${sum('openCost').toFixed(0)} staked · now ${signed(sum('unrealised'))}`),
      tile('Won', settledN ? `${won} of ${settledN}` : '—', settledN ? `${Math.round((100 * won) / settledN)}% of settled bets` : 'no results yet'),
      tile('Total bets', String(sum('bets')), 'since the agent started'),
    ].join('');

    $('#strategies').innerHTML = `<thead><tr><th class="l">Strategy</th><th>Bets</th><th>Open</th><th>Won / settled</th><th>Settled profit</th><th>Return</th><th>Typical delay</th></tr></thead><tbody>${Object.entries(P.summary).map(([id, r]) => `<tr data-f="${esc(id)}"${filter === id ? ' aria-current="true"' : ''}><td class="l">${esc(name(id))}</td><td>${r.bets}</td><td>${r.open}</td><td>${r.settled ? `${r.won} / ${r.settled}` : '—'}</td><td>${signed(r.realised)}</td><td>${r.roi == null ? '—' : `<span class="${r.roi > 0 ? 'up' : r.roi < 0 ? 'down' : ''}">${pct(r.roi)}</span>`}</td><td>${r.medianLagSec == null ? '—' : lag(r.medianLagSec)}</td></tr>`).join('')}</tbody>`;
    $('#strategies').querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', () => { filter = tr.dataset.f; render(); }));

    $('#open-count').textContent = open.length ? `${open.length}` : '';
    $('#settled-count').textContent = settled.length ? `${settled.length}` : '';
    list($('#open'), open, 'open');
    list($('#settled'), settled, 'settled');

    const lines = (P.log || []).filter((l) => filter === 'all' || l.includes(` ${filter}:`));
    $('#feed').innerHTML = lines.length
      ? lines.slice(0, 40).map((l) => { const [ts, ...rest] = l.split(' '); return `<li><time>${esc(ts.slice(5, 16).replace('T', ' '))}</time>${esc(rest.join(' '))}</li>`; }).join('')
      : '<li>No activity yet.</li>';
    const sk = Object.entries(P.skipped || {}).filter(([k]) => filter === 'all' || k.startsWith(`${filter}:`) || !k.includes(':')).sort((a, b) => b[1] - a[1]);
    $('#skipped').innerHTML = sk.length ? sk.map(([k, v]) => `<li>${esc(k)}: ${v}</li>`).join('') : '<li>None.</li>';
  }

  render();

  // Live refresh when served over http(s): re-load paper.js every minute without reloading the page.
  if (/^https?:$/.test(location.protocol)) {
    setInterval(() => {
      const s = document.createElement('script');
      s.src = `paper.js?t=${Date.now()}`;
      s.onload = () => { s.remove(); render(); };
      s.onerror = () => s.remove();
      document.body.appendChild(s);
    }, 60000);
  }
  // Keep "x min ago" labels current between refreshes.
  setInterval(render, 30000);
})();
