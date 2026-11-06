(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NAMES = { top20: 'Copy the top 20', slow20: 'Slow top 20', consensus: 'Consensus of 3+', consensus4: 'Consensus of 4+', 'consensus-noesports': 'Consensus 3+, no esports', 'consensus-limit': 'Consensus 3+, limit at their price', 'consensus-fast': 'Consensus 3+ within 1 hour', fade20: 'Fade the bottom 20 (retired)' };
  const baseOf = (book) => String(book || '').replace(/-(sized|pct)$/, '');
  const sizingOf = (book) => (/-pct$/.test(String(book || '')) ? 'pct' : /-sized$/.test(String(book || '')) ? 'sized' : 'flat');
  const isSized = (book) => sizingOf(book) === 'sized';
  const SIZING_LABEL = { flat: 'Flat $20', sized: 'By conviction', pct: '3% of wallet' };
  const name = (id) => NAMES[baseOf(id)] || baseOf(id);
  const bookName = (book) => `${name(book)} · ${({ flat: 'flat $20', sized: 'sized', pct: '3% of wallet' })[sizingOf(book)]}`;
  const bookOf = (p) => p.book || p.strategy;
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
  let sizing = 'all';
  try { filter = localStorage.getItem('pmw-bets-filter') || 'all'; sizing = localStorage.getItem('pmw-bets-sizing') || 'all'; } catch {}
  const matches = (book) => (filter === 'all' || baseOf(book) === filter) && (sizing === 'all' || sizing === sizingOf(book));
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
      <div class="row"><span class="meta"><b>${esc(p.outcome)}</b><span>$${Math.round(p.cost)} · ${esc(bookName(bookOf(p)))}</span></span>${state}</div>
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
    const checksFailing = P.errors && Object.keys(P.errors).length && (!P.lastPollOkAt || P.updatedAt - P.lastPollOkAt > 15 * 60);
    const fresh = Date.now() / 1000 - (P.updatedAt || 0) < 45 * 60 && !checksFailing;
    const status = $('#status');
    status.hidden = false;
    status.className = `pill ${fresh ? 'live' : 'idle'}`;
    status.textContent = checksFailing ? 'Agent can’t read new trades' : fresh ? 'Agent running' : 'Agent between runs';
    $('#meta').textContent = `Updated ${ago(P.updatedAt)} · each book has a $${P.bankroll || 500} paper wallet · checks for new results every minute`;

    const books = Object.keys(P.summary);
    const strategies = [...new Set(books.map(baseOf))];
    const chip = (attr, val, cur, label) => `<button type="button" data-${attr}="${esc(val)}" aria-pressed="${cur === val}">${esc(label)}</button>`;
    $('#chips').innerHTML = ['all', ...strategies].map((id) => chip('f', id, filter, id === 'all' ? 'All strategies' : name(id))).join('')
      + '<span class="chip-gap"></span>' + [['all', 'All sizes'], ['flat', 'Flat $20'], ['sized', 'Sized $10–50'], ['pct', '3% of wallet']].map(([v, l]) => chip('z', v, sizing, l)).join('');
    $('#chips').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.f) filter = b.dataset.f; else sizing = b.dataset.z;
      shown.open = shown.settled = 30;
      try { localStorage.setItem('pmw-bets-filter', filter); localStorage.setItem('pmw-bets-sizing', sizing); } catch {}
      render();
    }));

    const pos = (P.positions || []).filter((p) => matches(bookOf(p)));
    const open = pos.filter((p) => p.status === 'open');
    const settled = pos.filter((p) => p.status !== 'open').sort((a, b) => (b.settledAt || 0) - (a.settledAt || 0));
    const rows = books.filter(matches).map((b) => P.summary[b]);
    const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
    const staked = sum('staked'), realised = sum('realised'), won = sum('won'), settledN = sum('settled');
    const start = sum('start'), equity = sum('equity');
    $('#empty').hidden = sum('bets') > 0;

    const tile = (l, v, s) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
    $('#kpis').innerHTML = [
      tile(rows.length > 1 ? `Paper wallets (${rows.length} × $${P.bankroll || 500})` : 'Paper wallet', `$${equity.toFixed(2)}`, start ? `${signed(equity - start)} (${pct(equity / start - 1)}) · started at $${start.toFixed(0)}` : ''),
      tile('Settled profit', signed(realised), staked ? `${pct(realised / staked)} on $${staked.toFixed(0)} staked` : 'nothing settled yet'),
      tile('Open bets', String(sum('open')), `$${sum('openCost').toFixed(0)} staked · now ${signed(sum('unrealised'))}`),
      tile('Won', settledN ? `${won} of ${settledN}` : '—', settledN ? `${Math.round((100 * won) / settledN)}% of settled bets` : `${sum('bets')} bets so far`),
    ].join('');

    $('#strategies').innerHTML = `<thead><tr><th class="l">Strategy</th><th class="l">Bets sized</th><th>Wallet</th><th>Cash</th><th>Bets</th><th>Open</th><th>Won / settled</th><th>Settled profit</th><th>Avg bet</th><th>Typical delay</th></tr></thead><tbody>${books.filter(matches).map((b) => { const r = P.summary[b]; return `<tr data-f="${esc(baseOf(b))}" data-z="${sizingOf(b)}"><td class="l">${esc(name(b))}</td><td class="l">${SIZING_LABEL[sizingOf(b)]}</td><td>$${(r.equity ?? 0).toFixed(2)} ${r.walletReturn == null ? '' : `<span class="${r.walletReturn > 0 ? 'up' : r.walletReturn < 0 ? 'down' : ''}">${pct(r.walletReturn)}</span>`}</td><td>$${(r.cash ?? 0).toFixed(2)}</td><td>${r.bets}</td><td>${r.open}</td><td>${r.settled ? `${r.won} / ${r.settled}` : '—'}</td><td>${signed(r.realised)}</td><td>${r.avgStake == null ? '—' : `$${r.avgStake.toFixed(0)}`}</td><td>${r.medianLagSec == null ? '—' : lag(r.medianLagSec)}</td></tr>`; }).join('')}</tbody>`;
    $('#strategies').querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', () => { filter = tr.dataset.f; sizing = tr.dataset.z; render(); }));

    $('#open-count').textContent = open.length ? `${open.length}` : '';
    $('#settled-count').textContent = settled.length ? `${settled.length}` : '';
    list($('#open'), open, 'open');
    list($('#settled'), settled, 'settled');

    const lines = (P.log || []).filter((l) => { const m = l.match(/^\S+ (\S+):/); return !m || matches(m[1]); });
    $('#feed').innerHTML = lines.length
      ? lines.slice(0, 40).map((l) => { const [ts, ...rest] = l.split(' '); return `<li><time>${esc(ts.slice(5, 16).replace('T', ' '))}</time>${esc(rest.join(' '))}</li>`; }).join('')
      : '<li>No activity yet.</li>';
    const sk = Object.entries(P.skipped || {}).filter(([k]) => !k.includes(':') || matches(k.split(':')[0])).sort((a, b) => b[1] - a[1]);
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
