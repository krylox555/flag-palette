/* ============================================================
   데이터
============================================================ */

/* ============================================================
   공통 유틸
============================================================ */
function luminance(hex){
  const c = hex.replace('#','');
  const full = c.length === 3 ? c.split('').map(ch=>ch+ch).join('') : c;
  const r = parseInt(full.substr(0,2),16)/255;
  const g = parseInt(full.substr(2,2),16)/255;
  const b = parseInt(full.substr(4,2),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

function copyHex(hex){
  navigator.clipboard.writeText(hex);
  const overlay = document.getElementById("stampOverlay");
  const label = document.getElementById("stampHex");
  label.textContent = hex.toUpperCase();
  overlay.classList.remove("show");
  void overlay.offsetWidth; // 애니메이션 재생을 위한 강제 리플로우
  overlay.classList.add("show");
  clearTimeout(window._stampTimer);
  window._stampTimer = setTimeout(()=> overlay.classList.remove("show"), 1100);
}

function buildHexStack(container, colors){
  container.innerHTML = "";
  colors.forEach(hex => {
    const bar = document.createElement("div");
    bar.className = "hexbar";
    bar.style.background = hex;
    bar.style.color = luminance(hex) > 0.55 ? "#141312" : "#F2EFEA";
    bar.textContent = hex.toUpperCase();
    bar.onclick = () => copyHex(hex);
    container.appendChild(bar);
  });
}

function buildCrestStack(container, groups){
  container.innerHTML = "";
  groups.forEach(group => {
    const row = document.createElement("div");
    row.className = "crest-row";

    const label = document.createElement("div");
    label.className = "crest-row-label";
    label.textContent = group.label;
    row.appendChild(label);

    const swatches = document.createElement("div");
    swatches.className = "crest-swatches";
    group.colors.forEach(hex => {
      const sw = document.createElement("div");
      sw.className = "crest-swatch";
      sw.style.background = hex;
      sw.title = hex.toUpperCase();
      sw.onclick = () => copyHex(hex);
      swatches.appendChild(sw);
    });
    row.appendChild(swatches);

    container.appendChild(row);
  });
}

function buildStripeBanner(container, colors){
  container.innerHTML = "";
  colors.forEach(hex => {
    const s = document.createElement("span");
    s.style.background = hex;
    container.appendChild(s);
  });
}

// 초성 검색 지원
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function getChosung(str){
  let result = '';
  for (const ch of str){
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171){
      result += CHO[Math.floor(code / 588)];
    } else {
      result += ch;
    }
  }
  return result;
}
function isChosungOnly(str){ return str.length > 0 && /^[ㄱ-ㅎ]+$/.test(str); }

// 정확도 점수: 0 = 완전 일치/접두어 일치(가장 정확), 1 = 단어 중간 포함, -1 = 매치 안 됨
function matchTier(name, query){
  if (isChosungOnly(query)){
    const chosung = getChosung(name);
    if (chosung.startsWith(query)) return 0; // 초성 접두 일치
    return -1;
  }
  if (name.startsWith(query)) return 0; // 문자열 접두 일치 (완전 일치 포함)
  if (name.includes(query)) return 1;   // 그 외 포함
  return -1;
}
/* ============================================================
   탭 전환
============================================================ */
function switchView(view, el){
  document.querySelectorAll('.navlinks span').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  window.scrollTo({top:0, behavior:'instant'});
}

function goHome(){
  document.querySelectorAll('.navlinks span').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-home').classList.add('active');
  window.scrollTo({top:0, behavior:'instant'});
}
/* ============================================================
   테마 전환
============================================================ */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'light' ? '🌙' : '☀️';
}

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('flagPaletteTheme', next);
}

// 페이지 로드 시 마지막으로 선택한 테마 복원 (없으면 기본값 dark)
applyTheme(localStorage.getItem('flagPaletteTheme') || 'dark');

/* ============================================================
   공통: 국가/역사 항목을 함께 다루는 유틸
============================================================ */
function resolveEntry(type, id){
  if (type === 'historical') return historicalFlags.find(f => f.name === id);
  if (type === 'other') return otherFlags.find(f => f.name === id);
  return flags.find(f => f.iso === id);
}

function buildFlagPreview(type, entry){
  const wrap = document.createElement('div');
  wrap.className = 'fav-card-flag';

  if (type === 'historical' || type === 'other'){
    const showStripe = () => {
      wrap.innerHTML = '';
      const stripe = document.createElement('div');
      stripe.className = 'fav-card-stripe';
      entry.colors.forEach(hex => {
        const s = document.createElement('span');
        s.style.background = hex;
        stripe.appendChild(s);
      });
      wrap.appendChild(stripe);
    };
    if (entry.wikiFile){
      const img = document.createElement('img');
      img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${entry.wikiFile}?width=160`;
      img.alt = entry.name + ' 국기';
      img.onerror = showStripe;
      wrap.appendChild(img);
    } else {
      showStripe();
    }
  } else {
    const img = document.createElement('img');
    img.src = `https://flagcdn.com/w160/${entry.iso}.png`;
    img.alt = entry.name + ' 국기';
    const emoji = document.createElement('div');
    emoji.className = 'fav-card-flag-emoji';
    emoji.textContent = flagEmojiFromIso(entry.iso);
    img.onerror = () => { img.style.display = 'none'; emoji.style.display = 'flex'; };
    wrap.appendChild(img);
    wrap.appendChild(emoji);
  }
  return wrap;
}

function openEntry(type, entry){
  if (type === 'historical'){
    switchView('historical', document.querySelector('[data-view=historical]'));
    document.getElementById('search-historical').value = entry.name;
    showHistorical(entry);
  } else if (type === 'other'){
    switchView('other', document.querySelector('[data-view=other]'));
    document.getElementById('search-other').value = entry.name;
    showOther(entry);
  } else {
    switchView('countries', document.querySelector('[data-view=countries]'));
    document.getElementById('search-countries').value = entry.name;
    showCountry(entry);
  }
}

function syncFavButtons(){
  const favBtn = document.getElementById('favBtn');
  if (favBtn.dataset.id) updateFavButton('favBtn', 'country', favBtn.dataset.id);
  const favBtnH = document.getElementById('favBtnHistorical');
  if (favBtnH.dataset.id) updateFavButton('favBtnHistorical', 'historical', favBtnH.dataset.id);
}

function buildEntryCard(item, removable){
  const entry = resolveEntry(item.type, item.id);
  if (!entry) return null;

  const card = document.createElement('div');
  card.className = 'fav-card';
  card.appendChild(buildFlagPreview(item.type, entry));

  const nameDiv = document.createElement('div');
  nameDiv.className = 'fav-card-name';
  nameDiv.textContent = entry.name;
  card.appendChild(nameDiv);

  card.onclick = () => openEntry(item.type, entry);

  if (removable){
    const removeBtn = document.createElement('button');
    removeBtn.className = 'fav-card-remove';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', '즐겨찾기 해제');
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(item.type, item.id);
      renderFavorites();
      syncFavButtons();
    };
    card.appendChild(removeBtn);
  }

  return card;
}

/* ============================================================
   즐겨찾기
============================================================ */
const FAVORITES_KEY = 'flagPaletteFavorites';

function getFavorites(){
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    return raw.map(item => typeof item === 'string' ? {type:'country', id:item} : item);
  } catch {
    return [];
  }
}

function saveFavorites(list){
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(type, id){
  return getFavorites().some(item => item.type === type && item.id === id);
}

function toggleFavorite(type, id){
  const list = getFavorites();
  const idx = list.findIndex(item => item.type === type && item.id === id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({type, id});
  saveFavorites(list);
  return list.some(item => item.type === type && item.id === id);
}

function updateFavButton(btnId, type, id){
  const btn = document.getElementById(btnId);
  const active = isFavorite(type, id);
  btn.textContent = active ? '★' : '☆';
  btn.classList.toggle('active', active);
  btn.dataset.type = type;
  btn.dataset.id = id;
}

function handleFavoriteToggle(btnId){
  const btn = document.getElementById(btnId);
  const type = btn.dataset.type;
  const id = btn.dataset.id;
  if (!type || !id) return;
  const active = toggleFavorite(type, id);
  btn.textContent = active ? '★' : '☆';
  btn.classList.toggle('active', active);
}

let favFilterType = 'all';

function setFavFilter(type, el){
  favFilterType = type;
  document.querySelectorAll('#favFilter .fav-filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFavorites();
}

function renderFavorites(){
  let items = getFavorites();
  if (favFilterType !== 'all'){
    items = items.filter(item => item.type === favFilterType);
  }
  const grid = document.getElementById('favGrid');
  const empty = document.getElementById('empty-favorites');
  grid.innerHTML = '';
  if (items.length === 0){ empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  items.forEach(item => {
    const card = buildEntryCard(item, true);
    if (card) grid.appendChild(card);
  });
}

/* ============================================================
   최근 입국 기록
============================================================ */
const RECENT_KEY = 'flagPaletteRecent';
const RECENT_MAX = 20;

function getRecent(){
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    return raw.map(item => typeof item === 'string' ? {type:'country', id:item} : item);
  } catch {
    return [];
  }
}

function saveRecent(list){
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function recordRecent(type, id){
  let list = getRecent();
  list = list.filter(item => !(item.type === type && item.id === id));
  list.unshift({type, id});
  if (list.length > RECENT_MAX) list = list.slice(0, RECENT_MAX);
  saveRecent(list);
}

function renderRecent(){
  const items = getRecent();
  const grid = document.getElementById('recentGrid');
  const empty = document.getElementById('empty-recent');
  const clearBtn = document.getElementById('clearRecentBtn');
  grid.innerHTML = '';
  if (items.length === 0){
    empty.style.display = 'block';
    clearBtn.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  clearBtn.style.display = 'inline-block';
  items.forEach(item => {
    const card = buildEntryCard(item, false);
    if (card) grid.appendChild(card);
  });
}

function showConfirm(message, onConfirm){
  const overlay = document.getElementById('confirmOverlay');
  document.getElementById('confirmTitle').textContent = message;
  overlay.classList.add('show');

  const okBtn = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');

  function cleanup(){
    overlay.classList.remove('show');
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
    overlay.removeEventListener('click', handleOverlayClick);
  }
  function handleOk(){ cleanup(); onConfirm(); }
  function handleCancel(){ cleanup(); }
  function handleOverlayClick(e){ if (e.target === overlay) cleanup(); }

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
  overlay.addEventListener('click', handleOverlayClick);
}

function clearAllRecent(){
  showConfirm('최근 입국 기록을 모두 지울까요?', () => {
    saveRecent([]);
    renderRecent();
  });
}

/* ============================================================
   1) 국기 색 검색기
============================================================ */
function flagEmojiFromIso(iso){
  const base = 0x1F1E6;
  return String.fromCodePoint(...iso.toUpperCase().split('').map(c => base + (c.charCodeAt(0) - 65)));
}

const crestState = {
  countries: { current: null, showing: false },
  historical: { current: null, showing: false }
};

function toggleCrestView(kind){
  const state = crestState[kind];
  if (!state.current || !state.current.crest) return;
  state.showing = !state.showing;

  const btnId = kind === 'historical' ? 'crestToggleHistorical' : 'crestToggle';
  const stackId = kind === 'historical' ? 'hexstack-historical' : 'hexstack-countries';
  const btn = document.getElementById(btnId);
  const stack = document.getElementById(stackId);

  if (state.showing){
    buildCrestStack(stack, state.current.crest.groups);
    btn.textContent = '국기 색 보기';
    btn.classList.add('active');
  } else {
    buildHexStack(stack, state.current.colors);
    btn.textContent = '국장 색 보기';
    btn.classList.remove('active');
  }
}

function setupCrestToggle(kind, entry){
  crestState[kind].current = entry;
  crestState[kind].showing = false;
  const btnId = kind === 'historical' ? 'crestToggleHistorical' : 'crestToggle';
  const btn = document.getElementById(btnId);
  if (entry.crest && entry.crest.groups && entry.crest.groups.length){
    btn.style.display = 'inline-block';
    btn.textContent = '국장 색 보기';
    btn.classList.remove('active');
  } else {
    btn.style.display = 'none';
  }
}

function showCountry(f){
  const img = document.getElementById("flagimg");
  const fallback = document.getElementById("flagEmojiFallback");
  img.style.display = "block";
  fallback.style.display = "none";
  img.onerror = () => {
    img.style.display = "none";
    fallback.style.display = "flex";
    fallback.textContent = flagEmojiFromIso(f.iso);
  };
  img.src = f.wikiFile
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${f.wikiFile}?width=320`
    : `https://flagcdn.com/w320/${f.iso}.png`;
  img.alt = f.name + " 국기";

document.getElementById("countryname-countries").textContent = f.name;
  buildHexStack(document.getElementById("hexstack-countries"), f.colors);
  setupCrestToggle('countries', f);

document.getElementById("result-countries").classList.add("show");
  document.getElementById("empty-countries").style.display = "none";
  document.getElementById("suggestions-countries").style.display = "none";
  updateFavButton('favBtn', 'country', f.iso);
  recordRecent('country', f.iso);
}

setupSearch({
  inputId: "search-countries",
  suggestionsId: "suggestions-countries",
  resultId: "result-countries",
  emptyId: "empty-countries",
  data: flags,
  onSelect: showCountry
});
document.getElementById("suggestions-countries").style.display = "none";
/* ============================================================
   2) 역사적 국기 검색기
============================================================ */
function showHistorical(f){
  const img = document.getElementById("historicalFlagImg");
  const banner = document.getElementById("stripebanner-historical");

  function showFallbackBanner(){
    img.style.display = "none";
    banner.style.display = "flex";
    buildStripeBanner(banner, f.colors);
  }

  if (f.wikiFile){
    img.style.display = "block";
    banner.style.display = "none";
    img.onerror = showFallbackBanner;
    img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${f.wikiFile}?width=320`;
    img.alt = f.name + " 국기";
  } else {
    showFallbackBanner();
  }

  document.getElementById("countryname-historical").textContent = f.name;
  document.getElementById("countrymeta-historical").textContent = f.period;
  buildHexStack(document.getElementById("hexstack-historical"), f.colors);
  setupCrestToggle('historical', f);
  updateFavButton('favBtnHistorical', 'historical', f.name);
  recordRecent('historical', f.name);

  document.getElementById("result-historical").classList.add("show");
  document.getElementById("empty-historical").style.display = "none";
  document.getElementById("suggestions-historical").style.display = "none";
}

setupSearch({
  inputId: "search-historical",
  suggestionsId: "suggestions-historical",
  resultId: "result-historical",
  emptyId: "empty-historical",
  data: historicalFlags,
  onSelect: showHistorical
});

function showOther(f){
  const img = document.getElementById("otherFlagImg");
  const banner = document.getElementById("stripebanner-other");

  function showFallbackBanner(){
    img.style.display = "none";
    banner.style.display = "flex";
    buildStripeBanner(banner, f.colors);
  }

  if (f.wikiFile){
    img.style.display = "block";
    banner.style.display = "none";
    img.onerror = showFallbackBanner;
    img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${f.wikiFile}?width=320`;
    img.alt = f.name + " 깃발";
  } else {
    showFallbackBanner();
  }

  document.getElementById("countryname-other").textContent = f.name;
  document.getElementById("countrymeta-other").textContent = f.category;
  buildHexStack(document.getElementById("hexstack-other"), f.colors);
  updateFavButton('favBtnOther', 'other', f.name);
  recordRecent('other', f.name);

  document.getElementById("result-other").classList.add("show");
  document.getElementById("empty-other").style.display = "none";
  document.getElementById("suggestions-other").style.display = "none";
}

setupSearch({
  inputId: "search-other",
  suggestionsId: "suggestions-other",
  resultId: "result-other",
  emptyId: "empty-other",
  data: otherFlags,
  onSelect: showOther
});

/* ============================================================
   3) 행정구역 상징색 검색기 — 아직 구현되지 않음 (준비 중 화면만 표시)
============================================================ */

/* ============================================================
   공통 검색 인풋 로직
============================================================ */
function setupSearch({inputId, suggestionsId, resultId, emptyId, data, onSelect}){
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  const result = document.getElementById(resultId);
  const empty = document.getElementById(emptyId);
  const emptyDefaultText = empty.textContent;

  let currentMatches = [];
  let highlightIndex = -1;

function getSortedMatches(q){
  return data
    .map(f => ({ f, tier: matchTier(f.name, q) }))
    .filter(x => x.tier >= 0)
    .sort((a, b) => a.tier - b.tier || a.f.name.localeCompare(b.f.name, 'ko'))
    .map(x => x.f);
}

  function renderHighlight(){
    Array.from(suggestions.children).forEach((el, i) => {
      el.classList.toggle('highlighted', i === highlightIndex);
    });
  }

  function renderSuggestions(matches){
    suggestions.innerHTML = "";
    matches.forEach((f, i) => {
      const div = document.createElement("div");
      div.textContent = f.name;
      div.onmouseenter = () => { highlightIndex = i; renderHighlight(); };
      div.onclick = () => {
        input.value = f.name;
        suggestions.style.display = "none";
        onSelect(f);
      };
      suggestions.appendChild(div);
    });
    renderHighlight();
  }

  input.addEventListener("input", () => {
    const q = input.value.trim();
    highlightIndex = -1;
    if (!q){
      currentMatches = [];
      suggestions.style.display = "none";
      result.classList.remove("show");
      empty.textContent = emptyDefaultText;
      empty.style.display = "block";
      return;
    }
    currentMatches = getSortedMatches(q).slice(0, 6);
    if (currentMatches.length === 0){
      suggestions.style.display = "none";
      result.classList.remove("show");
      empty.textContent = "일치하는 결과가 없어요.";
      empty.style.display = "block";
      return;
    }
    renderSuggestions(currentMatches);
    suggestions.style.display = "block";
    empty.style.display = "none";
    result.classList.remove("show");
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown"){
      if (currentMatches.length === 0) return;
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, currentMatches.length - 1);
      renderHighlight();
    } else if (e.key === "ArrowUp"){
      if (currentMatches.length === 0) return;
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
      renderHighlight();
    } else if (e.key === "Enter"){
      if (currentMatches.length === 0) return;
      const chosen = highlightIndex >= 0 ? currentMatches[highlightIndex] : currentMatches[0];
      if (chosen){
        input.value = chosen.name;
        suggestions.style.display = "none";
        onSelect(chosen);
      }
    } else if (e.key === "Escape"){
      suggestions.style.display = "none";
    }
  });
}
/* ============================================================
   행정구역 상징색 검색기
============================================================ */
let localGovActiveRegions = [];

const localGovCountryIcons = {
  kr: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M300.9 15.71c62.9 88.09 126.3 176.09 88.5 279.39l15.9-2.6l-27.5 96.5c-76.2 46-157.1 73.3-241.8 85.4c-9.6-43.1-21.2-85.9 3.6-133.1l24.5-44.1c-30-32.3-32.5-63.1-45.4-94.4c23-6.4 32.4-20.4 60.8 3.8L139.2 109c11.3-22.61 29.5-51.07 56.2-61.48c33.2-12.94 71.3 1.24 105.5-31.81"/></svg>',
  jp: '<svg viewBox="0 0 32 32"><g fill="currentColor"><path d="M22 9.01h.53c.28 0 .5-.22.5-.5s.22-.5.5-.5h1.26c.13 0 .26.05.35.15l.68.68c.11.11.26.16.41.14l.47-.05c.16-.02.3-.11.38-.26l.77-1.4c.09-.16.26-.26.44-.26h1.2c.28 0 .5-.22.5-.5V5.22a.47.47 0 0 0-.15-.35l-.71-.71a.5.5 0 0 0-.35-.15h-1.63c-.74 0-1.45-.29-1.98-.82l-1.04-1.04a.5.5 0 0 0-.35-.15h-1.36c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h.07c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5h-.1c-.78 0-1.4.63-1.4 1.4v.59c.01.57.46 1.02 1.01 1.02M7.12 22.32l-.57.85c-.24.36.02.85.45.85h6.37c.34 0 .61.27.61.61v.02c0 .76.61 1.37 1.37 1.37h.13c.83 0 1.5-.67 1.5-1.5c0-.29.21-.54.49-.6l3.56-.71c.62-.12 1.19-.43 1.63-.88l.14-.14c.12-.12.27-.18.44-.18h.02c.46 0 .91-.18 1.24-.51c.31-.31.49-.73.49-1.17v-4.21c0-.07.01-.13.03-.19l.87-2.62c.06-.18.03-.38-.07-.53l-1.47-2.2a.69.69 0 0 0-.93-.21l-.96.59c-.29.18-.47.5-.47.84v3.49c0 .34-.27.61-.61.61c-.24 0-.45.14-.55.35l-.67 1.42a.62.62 0 0 1-.55.35c-.34 0-.61-.27-.61-.61v-.07c0-.34-.27-.61-.61-.61h-.78c-.34 0-.61.27-.61.61v.58c0 .13-.04.25-.11.35l-.42.59a5.1 5.1 0 0 1-4.16 2.15H9.57c-.99.01-1.9.5-2.45 1.31m-4.13 5.2v2c0 .28.22.5.5.5h.43c1.22 0 2.28-.83 2.57-2.01l.43-1.72a.5.5 0 0 0-.13-.47l-1.65-1.65a.5.5 0 0 0-.35-.15H3.31c-.19 0-.36.11-.45.28l-.81 1.62c-.03.07-.05.15-.05.22v.38c0 .28.22.5.5.5c.27 0 .49.22.49.5"/><path d="M12.42 25.02a.58.58 0 0 1 .19 1.13l-2.21.74c-.24.08-.4.3-.4.55c0 .32-.26.58-.58.58h-.84a.58.58 0 0 1-.58-.58v-.54c0-.54.31-1.03.79-1.27l1.09-.55c.08-.04.17-.06.26-.06zm7.29-9c-.39 0-.71-.32-.71-.71c0-.19.07-.37.21-.5l.59-.59c.13-.14.31-.21.5-.21c.39 0 .71.32.71.71c0 .19-.08.37-.21.5l-.59.59c-.13.14-.31.21-.5.21"/></g></svg>',
  fr: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M283.4 19.83c-3.2 0-31.2 5.09-31.2 5.09c-1.3 41.61-30.4 78.48-90.3 84.88l-12.8-23.07l-25.1 2.48l11.3 60.09l-113.79-4.9l12.2 41.5C156.3 225.4 150.7 338.4 124 439.4c47 53 141.8 47.8 186 43.1c3.1-62.2 52.4-64.5 135.9-32.2c11.3-17.6 18.8-36 44.6-50.7l-46.6-139.5l-27.5 6.2c11-21.1 32.2-49.9 50.4-63.4l15.6-86.9c-88.6-6.3-146.4-46.36-199-96.17"/></svg>',
  br: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M292.8 41.71c16.1 58.89 125.3 78.19 197.9 116.19c1.6 35.2-14.4 72.6-56.7 102.3c2.9 70.2-41.8 110.2-114.3 132.4c-.3 33.2-12.7 64-47.3 90.3l-59-36.4l47.4-34.2c-1.8-25.6-9.6-52.3-55-67.3l-26.3-93.2c-54.5-10.4-51.9-31.3-56.3-50.9l-64.93 20.4c-49.154-31-51.902-75.4 6.26-83.4l6.99-72.78l51.18 9.12L133 37.03l49.6-7.9l20.7 37.33z"/></svg>',
  gb: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M419.424,366.943c1.352-2.247,1.484-5.028,0.336-7.392l-12.334-25.435c-1.266-2.611-3.877-4.3-6.775-4.37l-21.631-0.574c-2.65-0.077-5.086-1.488-6.454-3.765c-1.364-2.278-1.472-5.09-0.282-7.468l-1.922,3.859c0.976-1.976,1.081-4.262,0.286-6.299l-21.19-54.35c-0.574-1.487-1.596-2.75-2.924-3.641l-29.193-19.454c-1.449-0.976-2.538-2.409-3.076-4.06l-11.924-36.692c-0.282-0.876-0.716-1.681-1.278-2.402l-26.702-34.074c-1.193-1.518-2.925-2.549-4.835-2.866l-10.475-1.743c-3.018-0.504-5.454-2.72-6.229-5.664c-0.786-2.952,0.236-6.098,2.611-8.026l0.446-0.364c1.553-1.263,2.557-3.068,2.804-5.051l1.507-12.04c0.093-0.736,0.29-1.442,0.577-2.115l23.293-54.071c1.035-2.402,0.794-5.159-0.642-7.344c-1.438-2.178-3.874-3.502-6.485-3.502h-21.918c-0.511,0-1.027,0.062-1.522,0.163l-24.49,4.889c-3.173,0.635-6.407-0.767-8.116-3.526c-1.704-2.75-1.522-6.267,0.469-8.839l17.824-23.01c0.574-0.728,1.004-1.566,1.282-2.456l4.715-15.2c0.821-2.642,0.166-5.539-1.72-7.57c-1.89-2.037-4.715-2.913-7.422-2.294l-20.884,4.773c-0.976,0.225-1.987,0.264-2.971,0.101l-23.255-3.75c-3.835-0.628-7.53,1.689-8.669,5.4l-11.378,37.398c-0.542,1.782-1.72,3.316-3.312,4.315L145.419,61.03c-1.135,0.697-2.061,1.689-2.701,2.859l-2.684,4.928c-1.476,2.696-1.216,6.012,0.674,8.452l12.698,16.432c0.938,1.224,1.495,2.696,1.596,4.23l0.74,11.055c0.082,1.178-0.12,2.378-0.573,3.471l-7.295,17.626c-0.964,2.332-0.735,4.974,0.609,7.104c1.333,2.131,3.626,3.471,6.136,3.618l-1.488-0.086c2.228,0.125,4.296,1.209,5.676,2.96c1.379,1.759,1.933,4.021,1.526,6.214l-5.992,32.222c-0.163,0.868-0.17,1.751-0.035,2.611c1.452,1.333,3.362,2.123,5.4,2.076c2.905-0.077,5.532-1.766,6.795-4.37l4.443-9.142c1.244-2.557,3.777-4.23,6.617-4.37c2.839-0.14,5.52,1.286,7,3.72l4.645,7.623c1.348,2.216,1.499,4.958,0.403,7.314l-9.812,21.027c-1.542,3.292-0.582,7.213,2.301,9.436l17.292,13.295c2.506,1.929,5.93,2.138,8.658,0.543l11.32-6.633c2.552-1.494,5.725-1.418,8.197,0.21c2.467,1.627,3.8,4.51,3.432,7.446l-0.818,6.523c-0.178,1.442,0.047,2.898,0.659,4.215l10.479,22.723c0.503,1.07,0.743,2.255,0.716,3.44l-0.817,33.54c-0.09,3.649-2.7,6.732-6.276,7.438l-30.308,5.911c-3.11,0.596-5.543,3.045-6.136,6.16l-1.51,7.956c-0.403,2.115,0.085,4.308,1.363,6.035c1.271,1.744,3.212,2.882,5.354,3.122l1.886,0.224c4.002,0.465,6.977,3.928,6.849,7.95l-0.639,20.616c-0.094,2.905-1.794,5.508-4.416,6.763l-34.628,16.557c-1.983,0.954-3.471,2.704-4.098,4.804c-0.62,2.115-0.326,4.378,0.821,6.252l4.559,7.468c1.329,2.154,3.622,3.541,6.16,3.688l28.708,1.751c0.473,0.023,0.945,0.093,1.414,0.216l33.028,8.259c1.798,0.442,3.7,0.24,5.35-0.604l-13.24,6.64c3.312-1.666,7.333-0.744,9.607,2.177c0.845,1.084,1.248,2.355,1.433,3.642h-30.3c-2.805,0-5.396,1.518-6.768,3.959l-11.388,20.322c-0.388,0.712-0.891,1.348-1.484,1.89l-35.523,33.067c-1.735,1.603-2.642,3.935-2.452,6.29c0.194,2.371,1.454,4.524,3.429,5.842l4.436,2.959c3.235,2.154,7.562,1.58,10.134-1.333l14.832-16.858c1.848-2.107,4.687-3.045,7.434-2.456l23.704,5.02c3.196,0.682,6.477-0.72,8.201-3.495l12.989-20.933c1.476-2.379,4.13-3.781,6.935-3.658l41.705,1.821c0.275,0.008,0.546,0,0.825-0.023l78.444-4.897c1.491-0.085,2.921-0.612,4.121-1.496l34.574-25.482c1.38-1.007,2.386-2.456,2.863-4.106l0.891-3.145c0.616-2.147,0.272-4.455-0.942-6.338c-1.212-1.875-3.176-3.138-5.384-3.471l-7.093-1.046c-2.569-0.38-4.773-2.03-5.888-4.37c-1.104-2.356-0.961-5.105,0.383-7.321L419.424,366.943z M161.522,227.851l-17.641-26.063c-1.844-2.728-5.438-3.642-8.348-2.107l-37.661,19.686c-1.201,0.628-2.181,1.619-2.786,2.835l-2.94,5.873c-1.305,2.619-0.705,5.772,1.472,7.709l10.808,9.676c2.642,2.37,6.705,2.161,9.099-0.473l5.822-6.407l5.633,12.063c0.918,1.968,2.758,3.347,4.9,3.665l12.83,1.929c2.46,0.372,4.912-0.697,6.307-2.758l12.489-18.361C162.999,232.926,162.999,230.035,161.522,227.851z M130.281,233.506l-3.154-9.467l7.887-4.726l2.363,6.314L130.281,233.506z"/></svg>',
  us: '<svg viewBox="0 0 15 15"><path fill="currentColor" d="M.52 3H8.5l-.25.5h.43l.57-.28l.3.28h.79l.31.31h-.66l-.59.42v.78l.1.49h.5l-.01-1.06l.35-.39h.31l.12.39l-.12.31h.33V5l.02.5h.5l.37-.23v-.26h.69v-.44l.46-.34h.82l.16.02l.25-.75h.5L15 4v.66l-.25.34l-.54.51l-.21.99l-.75.75l-.25.5V9l-1 .75v.5l.63 1.19l-.13.56H12l-.65-.76v-.52l-.38-.42l-.18.27l-.54-.27l-1.06.05v.27H7.82L7 11v1l-.77-.38L6 11l-.34-.59l-.66.14l-.22.27l-.38-.27L4 10l-.1-.14l-.53-.06l-.75-.37h-.69l-.35-.52h-.47L.35 7.02l-.23-.57v-.36L0 5.51l.25-.97L0 3.22h.35l.17.24z"/></svg>'
};

function renderLocalGovPicker(){
  const grid = document.getElementById('localgovCountryGrid');
  grid.innerHTML = '';

  localGovCountries.forEach(country => {
    const card = document.createElement('div');
    card.className = 'homecard' + (country.ready ? '' : ' homecard-disabled');

    if (!country.ready){
      const badge = document.createElement('div');
      badge.className = 'homecard-badge';
      badge.textContent = '준비중';
      card.appendChild(badge);
    }

  const stamp = document.createElement('div');
    stamp.className = 'homecard-stamp';
    stamp.innerHTML = localGovCountryIcons[country.code] || '';
    card.appendChild(stamp);

    const body = document.createElement('div');
    body.className = 'homecard-body';
    const title = document.createElement('div');
    title.className = 'homecard-title';
    title.textContent = country.name;
    const desc = document.createElement('div');
    desc.className = 'homecard-desc';
    desc.textContent = country.ready
      ? (country.tiers ? `${country.tiers.length}단계 행정구역` : `${country.regions.length}개 행정구역`)
      : '준비 중이에요.';
    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(body);

    if (country.ready){
      card.onclick = () => openLocalGovCountry(country);
    }

    grid.appendChild(card);
  });
}

let currentLocalGovCountry = null;

function openLocalGovCountry(country){
  currentLocalGovCountry = country;
  document.getElementById('localgov-picker').style.display = 'none';

  if (country.tiers){
    renderLocalGovTiers(country);
    document.getElementById('localgov-tiers').style.display = 'block';
    document.getElementById('localgov-search').style.display = 'none';
  } else {
    openLocalGovTier(country.name, country.regions);
  }
}

function renderLocalGovTiers(country){
  const grid = document.getElementById('localgovTierGrid');
  grid.innerHTML = '';
  country.tiers.forEach(tier => {
    const card = document.createElement('div');
    card.className = 'homecard';

    const body = document.createElement('div');
    body.className = 'homecard-body';
    const title = document.createElement('div');
    title.className = 'homecard-title';
    title.textContent = tier.label;
    const desc = document.createElement('div');
    desc.className = 'homecard-desc';
    desc.textContent = tier.regions.length > 0 ? `${tier.regions.length}개` : '준비 중이에요.';
    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(body);

    card.onclick = () => openLocalGovTier(country.name + ' · ' + tier.label, tier.regions);
    grid.appendChild(card);
  });
}

function openLocalGovTier(label, regions){
  localGovActiveRegions.length = 0;
  localGovActiveRegions.push(...regions);

  document.getElementById('localgov-tiers').style.display = 'none';
  document.getElementById('localgov-search').style.display = 'block';
  document.getElementById('localgov-country-eyebrow').textContent = label + ' · Administrative Regions';
  document.getElementById('search-localgov').value = '';
  document.getElementById('result-localgov').classList.remove('show');
  document.getElementById('empty-localgov').style.display = 'block';
}

function backToLocalGovTiers(){
  document.getElementById('localgov-tiers').style.display = 'block';
  document.getElementById('localgov-search').style.display = 'none';
}

function backFromLocalGovSearch(){
  if (currentLocalGovCountry && currentLocalGovCountry.tiers){
    backToLocalGovTiers();
  } else {
    backToLocalGovPicker();
  }
}

function backToLocalGovPicker(){
  document.getElementById('localgov-picker').style.display = 'block';
  document.getElementById('localgov-tiers').style.display = 'none';
  document.getElementById('localgov-search').style.display = 'none';
}

function showLocalGov(f){
  const img = document.getElementById('localGovImg');
  const banner = document.getElementById('stripebanner-localgov');

  function showFallbackBanner(){
    img.style.display = 'none';
    banner.style.display = 'flex';
    buildStripeBanner(banner, f.colors);
  }

  const imageUrl = f.image
    ? f.image
    : (f.wikiFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${f.wikiFile}?width=320` : null);

  if (imageUrl){
    img.style.display = 'block';
    banner.style.display = 'none';
    img.onerror = showFallbackBanner;
    img.src = imageUrl;
    img.alt = f.name + ' 상징기';
  } else {
    showFallbackBanner();
  }

  document.getElementById('countryname-localgov').textContent = f.name;
  buildHexStack(document.getElementById('hexstack-localgov'), f.colors);

  document.getElementById('result-localgov').classList.add('show');
  document.getElementById('empty-localgov').style.display = 'none';
  document.getElementById('suggestions-localgov').style.display = 'none';
}

setupSearch({
  inputId: "search-localgov",
  suggestionsId: "suggestions-localgov",
  resultId: "result-localgov",
  emptyId: "empty-localgov",
  data: localGovActiveRegions,
  onSelect: showLocalGov
});