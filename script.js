// ── Theme ────────────────────────────────────────────────────
const html = document.documentElement

function initTheme() {
    applyTheme(localStorage.getItem('theme') || 'dark')
}

function applyTheme(theme) {
    html.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    const btn = document.getElementById('theme-btn')
    if (btn) btn.textContent = theme === 'dark' ? '☀️ 라이트' : '🌙 다크'
}

function toggleTheme() {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
}

// ── Navigation ───────────────────────────────────────────────
function showPage(pageId, navEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    const target = document.getElementById('page-' + pageId)
    if (target) target.classList.add('active')
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))
    if (navEl) navEl.classList.add('active')
    window.scrollTo(0, 0)
}

// ── Unlock UI helpers ────────────────────────────────────────
function applyUnlock(id, unlocked) {
    const body = document.getElementById('ul-' + id)
    const btn  = document.getElementById('ulbtn-' + id)
    if (!body || !btn) return
    if (unlocked) {
        body.classList.add('show')
        btn.classList.add('open')
        btn.textContent = '🔓 추가 정보 (해금됨)'
    } else {
        body.classList.remove('show')
        btn.classList.remove('open')
        btn.textContent = '🔒 추가 정보 해금'
    }
}

function setSyncStatus(online) {
    const dot  = document.getElementById('sync-dot')
    const text = document.getElementById('sync-text')
    if (!dot || !text) return
    dot.classList.toggle('online', online)
    text.textContent = online ? '동기화 연결됨' : '로컬 모드'
}

// ── Firebase / Unlock ────────────────────────────────────────
function initFirebase() {
    const configured = typeof firebaseConfig !== 'undefined'
        && firebaseConfig.apiKey
        && firebaseConfig.databaseURL

    if (!configured || typeof firebase === 'undefined') {
        loadFromLocalStorage()
        setSyncStatus(false)
        return
    }

    try {
        firebase.initializeApp(firebaseConfig)
        const db = firebase.database()
        window._db = db

        db.ref('unlocks').on('value', snap => {
            const data = snap.val() || {}
            document.querySelectorAll('.unlock-body').forEach(el => {
                const id = el.id.replace('ul-', '')
                applyUnlock(id, !!data[id])
            })
            setSyncStatus(true)
        }, err => {
            console.warn('[Firebase] 연결 실패:', err.message)
            loadFromLocalStorage()
            setSyncStatus(false)
        })
    } catch (e) {
        console.warn('[Firebase] 초기화 실패:', e.message)
        loadFromLocalStorage()
        setSyncStatus(false)
    }
}

function loadFromLocalStorage() {
    document.querySelectorAll('.unlock-body').forEach(el => {
        const id = el.id.replace('ul-', '')
        if (localStorage.getItem('ul-' + id)) applyUnlock(id, true)
    })
}

async function toggleUnlock(id) {
    const db = window._db
    if (db) {
        const ref  = db.ref('unlocks/' + id)
        const snap = await ref.once('value')
        snap.val() ? await ref.remove() : await ref.set(true)
        // onValue listener handles UI update
    } else {
        const body = document.getElementById('ul-' + id)
        if (!body) return
        const isOpen = body.classList.contains('show')
        isOpen ? localStorage.removeItem('ul-' + id) : localStorage.setItem('ul-' + id, '1')
        applyUnlock(id, !isOpen)
    }
}

// ── AS (Another Style) Toggle ────────────────────────────────
const CHARS = ['nelly', 'chloe', 'yuzu', 'garnet']

function initASStates() {
    CHARS.forEach(id => {
        if (localStorage.getItem('as-' + id) === 'true') setAS(id, true)
    })
}

function toggleAS(id) {
    const card = document.getElementById('char-' + id)
    if (!card) return
    const next = card.getAttribute('data-as') !== 'true'
    setAS(id, next)
    localStorage.setItem('as-' + id, next)
}

function setAS(id, on) {
    const card = document.getElementById('char-' + id)
    if (!card) return
    card.setAttribute('data-as', on ? 'true' : 'false')
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme()
    initFirebase()
    initASStates()
})
