(() => {
  const R = window.REPORT;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (x, d = 0) => {
    const a = Math.abs(x || 0), sign = x < 0 ? '−' : '';
    if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
    if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
    if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(1)}K`;
    return `${sign}$${a.toLocaleString('en-US', { maximumFractionDigits: d })}`;
  };
  const signed = (x) => `<span class="${x > 0 ? 'up' : x < 0 ? 'down' : ''}">${x > 0 ? '+' : ''}${money(x)}</span>`;
  const pct = (x, d = 0) => `${((x || 0) * 100).toFixed(d)}%`;
  const cents = (p) => `${Math.round((p || 0) * 100)}¢`;
  const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
  const label = (w) => esc(w.name && !/^0x[0-9a-f]{6,}/i.test(w.name) ? w.name : short(w.address));
  const pmUser = (a) => `https://polymarket.com/profile/${encodeURIComponent(a)}`;
  const pmEvent = (m) => (m.eventSlug || m.slug ? `https://polymarket.com/event/${encodeURIComponent(m.eventSlug || m.slug)}` : '#');
  const ago = (ts) => { if (!ts) return '—'; const h = (Date.now() / 1000 - ts) / 3600; return h < 1 ? 'just now' : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`; };
  const pf = (x) => (x == null ? '∞' : x.toFixed(2));

  // ---------- tabs ----------
  const tabs = document.querySelectorAll('.tabs button');
  const show = (name) => {
    tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    document.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== name || !R));
    try { localStorage.setItem('pmw-tab', name); } catch {}
  };
  tabs.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));

  if (!R || !R.wallets?.length) {
    $('#empty').hidden = false; $('#meta').textContent = 'No report loaded';
    document.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== 'method'));
    return;
  }
  let saved = 'overview'; try { saved = localStorage.getItem('pmw-tab') || saved; } catch {}
  show(saved);

  const W = R.wallets;
  const byAddr = new Map(W.map((w) => [w.address, w]));
  const d = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
  $('#meta').textContent = `${W.length} wallets · ${R.window.days}-day window ${d(R.window.start)} → ${d(R.window.end)} · data from ${new Date(R.generatedAt * 1000).toUTCString().replace(':00 GMT', ' UTC')}`;

  // ---------- tooltip ----------
  const tip = $('#tip');
  const showTip = (html, ev) => {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = `${Math.max(8, x)}px`; tip.style.top = `${Math.max(8, y)}px`;
  };
  const hideTip = () => (tip.hidden = true);

  // ---------- KPIs ----------
  const S = R.summary;
  const kpi = (l, v, s = '') => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  $('#kpis').innerHTML = [
    kpi('Wallets analysed', W.length.toLocaleString(), `${S.totalTrades.toLocaleString()} trades`),
    kpi('Combined volume', money(S.totalVolume), `${R.window.days} days`),
    kpi('Combined 90-day PnL', signed(S.totalPnl), `realised ${money(S.totalRealized)}`),
    kpi('Profitable wallets', pct(S.profitableShare), 'of the analysed cohort'),
    kpi('Median win rate', pct(S.medianWinRate), 'wallets with ≥10 decided positions'),
    kpi('Top-10 share of profits', pct(S.top10PnlShare), 'of all positive 90-day PnL'),
  ].join('');

  // ---------- bar list ----------
  const bars = (el, rows, fmt) => {
    const max = Math.max(...rows.map((r) => r.v), 1);
    el.innerHTML = `<div class="bars">${rows.map((r) => `<div class="bar" title="${esc(r.k)}: ${esc(fmt(r.v))}"><span class="name">${esc(r.k)}</span><span class="track"><span class="fill" style="display:block;width:${(100 * r.v) / max}%"></span></span><span class="val">${fmt(r.v)}</span></div>`).join('')}</div>`;
  };
  bars($('#cats'), S.categories.slice(0, 9).map((c) => ({ k: c.name, v: c.volume })), money);
  bars($('#archetypes'), S.archetypes.slice(0, 10).map((a) => ({ k: a.name, v: a.count })), (v) => String(v));
  $('#insights').innerHTML = R.insights.map((t) => `<li>${esc(t)}</li>`).join('') || '<li>Not enough closed positions to draw conclusions.</li>';

  // ---------- scatter: score (x) vs 90d pnl (y, symlog) ----------
  (function scatter() {
    const el = $('#scatter');
    const w = 640, h = 340, m = { l: 56, r: 12, t: 10, b: 30 };
    const sl = (v) => Math.sign(v) * Math.log10(1 + Math.abs(v));
    const ys = W.map((x) => sl(x.totalPnl90));
    const yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
    const X = (s) => m.l + (s / 100) * (w - m.l - m.r);
    const Y = (v) => m.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (h - m.t - m.b);
    const ticks = [];
    for (let e = 0; e <= 9; e++) for (const s of [1, -1]) { const v = s * 10 ** e; if (sl(v) >= yMin && sl(v) <= yMax) ticks.push(v); }
    ticks.push(0);
    ticks.sort((a, b) => Math.abs(a) - Math.abs(b));
    const kept = [];
    for (const t of ticks) if (kept.every((k) => Math.abs(Y(sl(k)) - Y(sl(t))) >= 18)) kept.push(t);
    ticks.length = 0; ticks.push(...kept);
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Scatter of score against 90-day PnL">`;
    for (const t of ticks) svg += `<line class="${t === 0 ? 'baseline' : 'gridline'}" x1="${m.l}" x2="${w - m.r}" y1="${Y(sl(t))}" y2="${Y(sl(t))}"/><text class="lbl" x="${m.l - 6}" y="${Y(sl(t)) + 4}" text-anchor="end">${t === 0 ? '$0' : money(t)}</text>`;
    for (const s of [0, 25, 50, 75, 100]) svg += `<text class="lbl" x="${X(s)}" y="${h - 10}" text-anchor="middle">${s}</text>`;
    svg += `<text class="lbl" x="${w - m.r}" y="${h - 10}" text-anchor="end" dx="-20">score →</text>`;
    W.forEach((x, i) => {
      svg += `<circle data-i="${i}" cx="${X(x.score)}" cy="${Y(ys[i])}" r="4.5" fill="var(--series)" fill-opacity="0.75" stroke="var(--surface)" stroke-width="2"/>`;
    });
    svg += '</svg>';
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    const pick = (ev) => {
      const pt = svgEl.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(svgEl.getScreenCTM().inverse());
      let best = -1, bd = 14 ** 2;
      W.forEach((x, i) => { const dd = (X(x.score) - p.x) ** 2 + (Y(ys[i]) - p.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      return best;
    };
    let hot = null;
    svgEl.addEventListener('mousemove', (ev) => {
      const i = pick(ev);
      if (hot) { hot.setAttribute('r', '4.5'); hot = null; }
      if (i < 0) return hideTip();
      hot = svgEl.querySelector(`circle[data-i="${i}"]`); hot.setAttribute('r', '7');
      const x = W[i];
      showTip(`<b>${label(x)}</b><br><span class="m">Score</span> ${x.score} · <span class="m">90d PnL</span> ${signed(x.totalPnl90)}<br><span class="m">Win rate</span> ${pct(x.winRate)} over ${x.wins + x.losses}`, ev);
    });
    svgEl.addEventListener('mouseleave', () => { hideTip(); if (hot) hot.setAttribute('r', '4.5'); });
    svgEl.addEventListener('click', (ev) => { const i = pick(ev); if (i >= 0) openWallet(W[i].address); });
    svgEl.style.cursor = 'pointer';
  })();

  // ---------- tables ----------
  const who = (w) => `<span class="who">${w.profileImage ? `<img src="${esc(w.profileImage)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span>${label(w)}${w.verified ? ' ✓' : ''}<br><span class="addr">${short(w.address)}</span></span></span>`;
  const scoreCell = (s) => `<span class="score">${s}<i><b style="width:${s}%"></b></i></span>`;
  const tags = (w) => w.archetypes.slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join('');

  const COLS = [
    { k: 'rank', h: '#', f: (w) => w.rank },
    { k: 'name', h: 'Wallet', l: true, f: who, sort: (w) => (w.name || w.address).toLowerCase() },
    { k: 'score', h: 'Score', f: (w) => scoreCell(w.score) },
    { k: 'totalPnl90', h: '90d PnL', f: (w) => signed(w.totalPnl90) },
    { k: 'realizedPnl', h: 'Realised', f: (w) => signed(w.realizedPnl) },
    { k: 'volume', h: 'Volume', f: (w) => money(w.volume) },
    { k: 'winRate', h: 'Win rate', f: (w) => `${pct(w.winRate)} <span class="addr">${w.wins + w.losses}</span>` },
    { k: 'profitFactor', h: 'Profit factor', f: (w) => pf(w.profitFactor), sort: (w) => (w.profitFactor == null ? 1e9 : w.profitFactor) },
    { k: 'roi', h: 'ROI', f: (w) => pct(w.roi, 1) },
    { k: 'trades', h: 'Trades', f: (w) => w.trades.toLocaleString() },
    { k: 'avgTrade', h: 'Avg trade', f: (w) => money(w.avgTrade) },
    { k: 'avgBuyPrice', h: 'Avg entry', f: (w) => cents(w.avgBuyPrice) },
    { k: 'portfolioValue', h: 'Portfolio', f: (w) => money(w.portfolioValue) },
    { k: 'archetypes', h: 'Style', l: true, f: tags, sort: (w) => w.archetypes[0] },
  ];

  function table(el, rows, cols, state, onRow) {
    const render = () => {
      const c = cols.find((x) => x.k === state.k);
      const key = c.sort || ((w) => w[c.k]);
      const sorted = [...rows()].sort((a, b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : 0) * state.dir; });
      el.innerHTML = `<thead><tr>${cols.map((x) => `<th class="${x.l ? 'l' : ''}" data-k="${x.k}" aria-sort="${x.k === state.k ? (state.dir > 0 ? 'ascending' : 'descending') : 'none'}">${x.h}${x.k === state.k ? (state.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr></thead>
        <tbody>${sorted.slice(0, state.limit || 500).map((r, i) => `<tr data-i="${i}">${cols.map((x) => `<td class="${x.l ? 'l' : ''}">${x.f(r)}</td>`).join('')}</tr>`).join('') || `<tr><td class="l" colspan="${cols.length}">Nothing matches.</td></tr>`}</tbody>`;
      el.querySelectorAll('th').forEach((th) => th.addEventListener('click', () => { state.dir = state.k === th.dataset.k ? -state.dir : th.dataset.k === 'rank' || th.dataset.k === 'name' ? 1 : -1; state.k = th.dataset.k; render(); }));
      if (onRow) el.querySelectorAll('tbody tr[data-i]').forEach((tr) => tr.addEventListener('click', (ev) => { if (!ev.target.closest('a')) onRow(sorted[+tr.dataset.i]); }));
    };
    render();
    return render;
  }

  table($('#top10'), () => W.slice(0, 10), COLS.filter((c) => ['rank', 'name', 'score', 'totalPnl90', 'winRate', 'volume', 'archetypes'].includes(c.k)), { k: 'rank', dir: 1 }, (w) => openWallet(w.address));

  const tagSel = $('#tag');
  S.archetypes.forEach((a) => tagSel.insertAdjacentHTML('beforeend', `<option>${esc(a.name)}</option>`));
  const filtered = () => {
    const q = $('#q').value.trim().toLowerCase(), t = tagSel.value, mc = +$('#minclosed').value;
    return W.filter((w) => (!t || w.archetypes.includes(t)) && w.closedCount >= mc && (!q || `${w.name} ${w.address} ${w.xUsername} ${w.archetypes.join(' ')}`.toLowerCase().includes(q)));
  };
  const rerender = table($('#wtable'), filtered, COLS, { k: 'rank', dir: 1 }, (w) => openWallet(w.address));
  ['input', 'change'].forEach((e) => { $('#q').addEventListener(e, rerender); tagSel.addEventListener(e, rerender); $('#minclosed').addEventListener(e, rerender); });
  if (window.self !== window.top) $('#csv').hidden = true; // embedded viewers block downloads
  $('#csv').addEventListener('click', () => {
    const cols = ['rank', 'score', 'address', 'name', 'totalPnl90', 'realizedPnl', 'unrealizedPnl', 'volume', 'trades', 'closedCount', 'winRate', 'profitFactor', 'roi', 'sharpe', 'avgTrade', 'avgBuyPrice', 'portfolioValue', 'archetypes'];
    const q = (v) => { const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [cols.join(','), ...filtered().map((w) => cols.map((c) => q(w[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'polymarket-top-wallets.csv'; a.click();
  });

  const holdersCell = (hs) => hs.slice(0, 4).map((h) => `<a href="#" data-addr="${esc(h.address)}">${label(h)}</a>`).join(', ') + (hs.length > 4 ? ` +${hs.length - 4}` : '');
  const mkt = (m) => `<a class="mkt" href="${pmEvent(m)}" target="_blank" rel="noopener" title="${esc(m.title)}">${esc(m.title)}</a>`;
  table($('#ctable'), () => R.consensus, [
    { k: 'title', h: 'Market', l: true, f: mkt },
    { k: 'outcome', h: 'Side', l: true, f: (m) => esc(m.outcome) },
    { k: 'holderCount', h: 'Wallets', f: (m) => m.holderCount },
    { k: 'avgScore', h: 'Avg score', f: (m) => m.avgScore },
    { k: 'value', h: 'Value held', f: (m) => money(m.value) },
    { k: 'avgEntry', h: 'Avg entry', f: (m) => cents(m.avgEntry) },
    { k: 'curPrice', h: 'Now', f: (m) => cents(m.curPrice) },
    { k: 'conviction', h: 'Conviction', f: (m) => pct(m.conviction) },
    { k: 'category', h: 'Category', l: true, f: (m) => esc(m.category) },
    { k: 'holders', h: 'Held by', l: true, f: (m) => holdersCell(m.holders), sort: (m) => m.holders.length },
  ], { k: 'holderCount', dir: -1 });
  table($('#ftable'), () => R.freshFlow, [
    { k: 'title', h: 'Market', l: true, f: mkt },
    { k: 'outcome', h: 'Side', l: true, f: (m) => esc(m.outcome) },
    { k: 'buyerCount', h: 'Wallets buying', f: (m) => m.buyerCount },
    { k: 'netFlow', h: 'Net flow', f: (m) => money(m.netFlow) },
    { k: 'lastTs', h: 'Last trade', f: (m) => ago(m.lastTs) },
    { k: 'category', h: 'Category', l: true, f: (m) => esc(m.category) },
    { k: 'buyers', h: 'Buyers', l: true, f: (m) => holdersCell(m.buyers), sort: (m) => m.buyers.length },
  ], { k: 'buyerCount', dir: -1 });
  document.addEventListener('click', (ev) => { const a = ev.target.closest('a[data-addr]'); if (a) { ev.preventDefault(); openWallet(a.dataset.addr); } });

  // ---------- wallet drawer ----------
  const drawer = $('#drawer');
  const closeDrawer = () => { drawer.hidden = true; hideTip(); if (location.hash.startsWith('#w-')) history.replaceState(null, '', location.pathname); };
  $('#dclose').addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (ev) => { if (ev.target === drawer) closeDrawer(); });
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  function equityChart(el, eq) {
    const w = 760, h = 220, m = { l: 60, r: 12, t: 10, b: 24 };
    const vals = eq.map((e) => e.cum);
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const X = (i) => m.l + (i / Math.max(1, eq.length - 1)) * (w - m.l - m.r);
    const Y = (v) => m.t + (1 - (v - lo) / (hi - lo || 1)) * (h - m.t - m.b);
    const ticks = [lo, (lo + hi) / 2, hi, 0].filter((v, i, a) => a.indexOf(v) === i);
    let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Cumulative realised PnL">`;
    for (const t of ticks) svg += `<line class="${t === 0 ? 'baseline' : 'gridline'}" x1="${m.l}" x2="${w - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="lbl" x="${m.l - 6}" y="${Y(t) + 4}" text-anchor="end">${money(t)}</text>`;
    [0, Math.floor(eq.length / 2), eq.length - 1].forEach((i) => eq[i] && (svg += `<text class="lbl" x="${X(i)}" y="${h - 6}" text-anchor="${i === 0 ? 'start' : i === eq.length - 1 ? 'end' : 'middle'}">${eq[i].date.slice(5)}</text>`));
    svg += `<path d="${eq.map((e, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(e.cum).toFixed(1)}`).join('')}" fill="none" stroke="var(--series)" stroke-width="2" stroke-linejoin="round"/>`;
    svg += `<line id="xh" class="baseline" y1="${m.t}" y2="${h - m.b}" visibility="hidden"/><circle id="xd" r="4" fill="var(--series)" stroke="var(--surface)" stroke-width="2" visibility="hidden"/><rect x="${m.l}" y="0" width="${w - m.l - m.r}" height="${h}" fill="transparent"/></svg>`;
    el.innerHTML = svg;
    const s = el.querySelector('svg'), xh = s.querySelector('#xh'), xd = s.querySelector('#xd');
    s.addEventListener('mousemove', (ev) => {
      const pt = s.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(s.getScreenCTM().inverse());
      const i = Math.max(0, Math.min(eq.length - 1, Math.round(((p.x - m.l) / (w - m.l - m.r)) * (eq.length - 1))));
      xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); xh.setAttribute('visibility', 'visible');
      xd.setAttribute('cx', X(i)); xd.setAttribute('cy', Y(eq[i].cum)); xd.setAttribute('visibility', 'visible');
      showTip(`<b>${eq[i].date}</b><br><span class="m">Day</span> ${signed(eq[i].pnl)}<br><span class="m">Cumulative</span> ${signed(eq[i].cum)}`, ev);
    });
    s.addEventListener('mouseleave', () => { hideTip(); xh.setAttribute('visibility', 'hidden'); xd.setAttribute('visibility', 'hidden'); });
  }

  function heat(el, hours) {
    const max = Math.max(...hours, 1);
    const step = (v) => (v === 0 ? 0 : 1 + Math.min(4, Math.floor((v / max) * 5)));
    el.innerHTML = `<div class="heat">${hours.map((v, h) => `<div style="background:var(--seq-${step(v)})" data-tip="${String(h).padStart(2, '0')}:00 UTC — ${v} trades"></div>`).join('')}</div><div class="heat-axis"><span>00 UTC</span><span>06</span><span>12</span><span>18</span><span>23</span></div>`;
    el.querySelectorAll('[data-tip]').forEach((c) => { c.addEventListener('mousemove', (ev) => showTip(esc(c.dataset.tip), ev)); c.addEventListener('mouseleave', hideTip); });
  }

  function openWallet(addr) {
    const w = byAddr.get(addr);
    if (!w) return;
    const xl = w.xUsername ? ` · <a href="https://x.com/${encodeURIComponent(w.xUsername)}" target="_blank" rel="noopener">@${esc(w.xUsername)}</a>` : '';
    const boards = w.boards.map((b) => `${b.timePeriod.toLowerCase()} ${b.orderBy.toLowerCase()} #${b.rank}`).join(', ');
    const posRows = (list, cols) => `<div class="tablewrap"><table><thead><tr>${cols.map((c) => `<th class="${c.l ? 'l' : ''}">${c.h}</th>`).join('')}</tr></thead><tbody>${list.map((r) => `<tr>${cols.map((c) => `<td class="${c.l ? 'l' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('') || `<tr><td class="l" colspan="${cols.length}">None</td></tr>`}</tbody></table></div>`;
    $('#dbody').innerHTML = `
      <div class="dhead">${w.profileImage ? `<img src="${esc(w.profileImage)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<div><h1 id="dtitle">${label(w)}${w.verified ? ' ✓' : ''}</h1>
      <div class="sub"><a href="${pmUser(w.address)}" target="_blank" rel="noopener">${esc(w.address)}</a>${xl}</div>
      <div>${w.archetypes.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div></div>
      <div class="kpis">
        ${kpi('Rank / score', `#${w.rank} · ${w.score}`, boards ? `leaderboards: ${esc(boards)}` : 'added manually')}
        ${kpi('90-day PnL', signed(w.totalPnl90), `realised ${money(w.realizedPnl)} · open ${money(w.unrealizedPnl)}`)}
        ${kpi('Win rate', pct(w.winRate), `${w.wins} wins / ${w.losses} losses${w.unredeemedCount ? ` · ${w.unredeemedCount} resolved, unredeemed` : ''}`)}
        ${kpi('Profit factor', pf(w.profitFactor), `avg win ${money(w.avgWin)} · avg loss ${money(w.avgLoss)}`)}
        ${kpi('Volume', money(w.volume), `${w.trades.toLocaleString()} trades · ${w.uniqueMarkets} markets${w.truncated ? ' · activity capped, volume understated' : ''}`)}
        ${kpi('Avg trade', money(w.avgTrade), `median ${money(w.medianTrade)} · max ${money(w.maxTrade)}`)}
        ${kpi('Sharpe (daily, ann.)', w.sharpe.toFixed(2), `max drawdown ${money(w.maxDrawdown)}`)}
        ${kpi('Portfolio', money(w.portfolioValue), `${w.openCount} open positions · last trade ${ago(w.lastTradeTs)}`)}
      </div>
      <div class="card"><h2>Cumulative realised PnL</h2><p class="hint">From positions closed each day in the window.</p><div id="eq" class="chart"></div></div>
      <div class="grid2">
        <div class="card"><h2>Entry price mix</h2><p class="hint">Share of buy dollars by price paid. Average entry ${cents(w.avgBuyPrice)}.</p><div id="pmix"></div></div>
        <div class="card"><h2>Categories</h2><p class="hint">Share of traded volume.</p><div id="wcats"></div></div>
      </div>
      <div class="card"><h2>When they trade</h2><p class="hint">Trades by hour (UTC). Darker means more trades.</p><div id="hours"></div></div>
      <div class="card"><h2>Open positions</h2>${posRows(w.openPositions, [
        { h: 'Market', l: true, f: (p) => mkt(p) }, { h: 'Side', l: true, f: (p) => esc(p.outcome) }, { h: 'Value', f: (p) => money(p.currentValue) },
        { h: 'Entry', f: (p) => cents(p.avgPrice) }, { h: 'Now', f: (p) => cents(p.curPrice) }, { h: 'PnL', f: (p) => signed(p.cashPnl) }])}</div>
      <div class="grid2">
        <div class="card"><h2>Best closes</h2>${posRows(w.bestTrades, [{ h: 'Market', l: true, f: (p) => mkt(p) }, { h: 'Side', l: true, f: (p) => esc(p.outcome) }, { h: 'PnL', f: (p) => signed(p.realizedPnl) }])}</div>
        <div class="card"><h2>Worst closes</h2>${posRows(w.worstTrades, [{ h: 'Market', l: true, f: (p) => mkt(p) }, { h: 'Side', l: true, f: (p) => esc(p.outcome) }, { h: 'PnL', f: (p) => signed(p.realizedPnl) }])}</div>
      </div>
      <div class="card"><h2>Most-traded markets</h2>${posRows(w.topMarkets, [{ h: 'Market', l: true, f: (p) => mkt(p) }, { h: 'Volume', f: (p) => money(p.volume) }, { h: 'Trades', f: (p) => p.trades }, { h: 'Cash in/out', f: (p) => signed(p.cashPnl) }])}</div>`;
    equityChart($('#eq'), w.equity);
    bars($('#pmix'), w.priceMix.map((b) => ({ k: b.label, v: b.share })), (v) => pct(v));
    bars($('#wcats'), w.categories.slice(0, 8).map((c) => ({ k: c.name, v: c.share })), (v) => pct(v));
    heat($('#hours'), w.hours);
    drawer.hidden = false;
    drawer.querySelector('.drawer-inner').scrollTop = 0;
    history.replaceState(null, '', `#w-${addr}`);
  }
  if (location.hash.startsWith('#w-')) openWallet(location.hash.slice(3));
  addEventListener('hashchange', () => { if (location.hash.startsWith('#w-')) openWallet(location.hash.slice(3)); });
})();
