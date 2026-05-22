import { firebaseConfig } from './config.js'

// ── Theme ─────────────────────────────────────────────────
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

// ── Navigation ───────────────────────────────────────────
function showPage(pageId, navEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    const target = document.getElementById('page-' + pageId)
    if (target) target.classList.add('active')

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'))
    const activeNav = navEl || document.querySelector(`.nav-item[data-page="${pageId}"]`)
    if (activeNav) activeNav.classList.add('active')

    window.scrollTo(0, 0)
}

// ── Unlock UI ─────────────────────────────────────────────
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

// ── Firebase ─────────────────────────────────────────────
let _db = null

async function initFirebase() {
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
        loadFromLocalStorage()
        setSyncStatus(false)
        return
    }

    try {
        const { initializeApp }             = await import('firebase/app')
        const { getDatabase, ref, onValue } = await import('firebase/database')

        const app = initializeApp(firebaseConfig)
        _db = getDatabase(app)

        onValue(ref(_db, 'unlocks'), snap => {
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
    if (_db) {
        const { ref, get, set, remove } = await import('firebase/database')
        const unlockRef = ref(_db, 'unlocks/' + id)
        const snap = await get(unlockRef)
        snap.val() ? await remove(unlockRef) : await set(unlockRef, true)
    } else {
        const body = document.getElementById('ul-' + id)
        if (!body) return
        const isOpen = body.classList.contains('show')
        isOpen ? localStorage.removeItem('ul-' + id) : localStorage.setItem('ul-' + id, '1')
        applyUnlock(id, !isOpen)
    }
}

// ── AS (Another Style) — 페이지 탭 전환 ─────────────────
const CHARS = ['nelly', 'chloe', 'yuzu', 'garnet']

function setPageAS(charId, on) {
    const page = document.getElementById('page-char-' + charId)
    if (!page) return
    page.setAttribute('data-as', on ? 'true' : 'false')
    localStorage.setItem('as-' + charId, on ? 'true' : 'false')

    const defTab = document.getElementById('stab-' + charId + '-def')
    const asTab  = document.getElementById('stab-' + charId + '-as')
    if (defTab) defTab.classList.toggle('active', !on)
    if (asTab)  asTab.classList.toggle('active', on)
}

function initASStates() {
    CHARS.forEach(id => {
        if (localStorage.getItem('as-' + id) === 'true') setPageAS(id, true)
    })
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme()
    initFirebase()
    initASStates()
})

// inline onclick 핸들러에 노출
window.showPage     = showPage
window.toggleTheme  = toggleTheme
window.toggleUnlock = toggleUnlock
window.setPageAS    = setPageAS
