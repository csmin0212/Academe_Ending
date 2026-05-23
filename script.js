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

// ── Character data ─────────────────────────────────────────
const CHAR_IDS = ['nelly', 'chloe', 'yuzu', 'garnet']
const _charCache = {}

function applyCharData(charId, data) {
    if (!data) return
    if (!_charCache[charId]) _charCache[charId] = {}
    Object.assign(_charCache[charId], data)
    const cache = _charCache[charId]

    document.querySelectorAll(`[data-char="${charId}"][data-field]`).forEach(el => {
        const field = el.dataset.field
        const val = data[field]
        if (val === undefined || val === null) return

        if (field === 'img_def' || field === 'img_as') {
            if (val) { el.src = val; el.style.display = '' }
            else       el.style.display = 'none'
        } else if (field.startsWith('intro_')) {
            el.innerHTML = val.replace(/\n/g, '<br>')
        } else {
            el.textContent = val
        }
    })

    // 로스터 카드 메타 갱신
    if (data.level !== undefined || data.job_def !== undefined) {
        document.querySelectorAll(`.roster-card[data-char="${charId}"] .roster-meta`).forEach(el => {
            el.textContent = `Lv. ${cache.level || '—'} · ${cache.job_def || '직업 미상'}`
        })
    }
}

// ── Firebase ─────────────────────────────────────────────
let _db = null, _fbRef = null, _fbSet = null, _fbGet = null, _fbRemove = null

async function initFirebase() {
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
        loadFromLocalStorage(); loadCharsLocal(); setSyncStatus(false); return
    }
    try {
        const { initializeApp } = await import('firebase/app')
        const { getDatabase, ref, onValue, get, set, remove } = await import('firebase/database')
        const app = initializeApp(firebaseConfig)
        _db = getDatabase(app)
        _fbRef = ref; _fbSet = set; _fbGet = get; _fbRemove = remove

        onValue(ref(_db, 'unlocks'), snap => {
            const d = snap.val() || {}
            document.querySelectorAll('.unlock-body').forEach(el => {
                const id = el.id.replace('ul-', '')
                applyUnlock(id, !!d[id])
            })
            setSyncStatus(true)
        }, err => {
            console.warn('[Firebase] 연결 실패:', err.message)
            loadFromLocalStorage(); loadCharsLocal(); setSyncStatus(false)
        })

        onValue(ref(_db, 'chars'), snap => {
            const d = snap.val() || {}
            CHAR_IDS.forEach(id => { if (d[id]) applyCharData(id, d[id]) })
        })
    } catch (e) {
        console.warn('[Firebase] 초기화 실패:', e.message)
        loadFromLocalStorage(); loadCharsLocal(); setSyncStatus(false)
    }
}

function loadFromLocalStorage() {
    document.querySelectorAll('.unlock-body').forEach(el => {
        const id = el.id.replace('ul-', '')
        if (localStorage.getItem('ul-' + id)) applyUnlock(id, true)
    })
}

function loadCharsLocal() {
    CHAR_IDS.forEach(id => {
        const stored = localStorage.getItem('char-' + id)
        if (stored) { try { applyCharData(id, JSON.parse(stored)) } catch (e) {} }
    })
}

async function toggleUnlock(id) {
    if (_db) {
        const snap = await _fbGet(_fbRef(_db, 'unlocks/' + id))
        snap.val()
            ? await _fbRemove(_fbRef(_db, 'unlocks/' + id))
            : await _fbSet(_fbRef(_db, 'unlocks/' + id), true)
    } else {
        const body = document.getElementById('ul-' + id)
        if (!body) return
        const isOpen = body.classList.contains('show')
        isOpen ? localStorage.removeItem('ul-' + id) : localStorage.setItem('ul-' + id, '1')
        applyUnlock(id, !isOpen)
    }
}

// ── AS (Another Style) ────────────────────────────────────
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

// ── Character Edit System ─────────────────────────────────
const CHAR_NAMES = {
    nelly:  '넬리 가우스',
    chloe:  '클로이 벨 디아스론드',
    yuzu:   '유즈 R 디아스타',
    garnet: '가넷 에버크레스트'
}

// tab: 'both'=공유 필드, 'def'=기본만, 'as'=AS만
const EDIT_FIELDS = [
    { id: 'level',     label: '레벨',       tab: 'both', type: 'input'    },
    { id: 'race',      label: '종족',       tab: 'both', type: 'input'    },
    { id: 'age',       label: '나이',       tab: 'both', type: 'input'    },
    { id: 'origin',    label: '출신',       tab: 'both', type: 'input'    },
    { id: 'job_def',   label: '직업',       tab: 'def',  type: 'input'    },
    { id: 'affil_def', label: '소속',       tab: 'def',  type: 'input'    },
    { id: 'quote_def', label: '대사',       tab: 'def',  type: 'input'    },
    { id: 'intro_def', label: '소개',       tab: 'def',  type: 'textarea' },
    { id: 'job_as',    label: '직업 (AS)',  tab: 'as',   type: 'input'    },
    { id: 'affil_as',  label: '소속 (AS)',  tab: 'as',   type: 'input'    },
    { id: 'quote_as',  label: '대사 (AS)',  tab: 'as',   type: 'input'    },
    { id: 'intro_as',  label: '소개 (AS)',  tab: 'as',   type: 'textarea' },
]

const _pendingImg = {}

function openEditPanel(charId) {
    let drawer = document.getElementById('edit-drawer-' + charId)
    if (!drawer) { drawer = buildEditDrawer(charId); document.body.appendChild(drawer) }
    populateEditPanel(charId)
    requestAnimationFrame(() => drawer.classList.add('open'))
    document.body.style.overflow = 'hidden'
}

function closeEditPanel(charId) {
    const drawer = document.getElementById('edit-drawer-' + charId)
    if (drawer) drawer.classList.remove('open')
    document.body.style.overflow = ''
}

function buildEditDrawer(charId) {
    const name = CHAR_NAMES[charId]

    const makeFields = (tab) => EDIT_FIELDS
        .filter(f => f.tab === tab || f.tab === 'both')
        .map(f => `<div class="edit-field">
            <label class="edit-label">${f.label}</label>
            ${f.type === 'textarea'
                ? `<textarea class="edit-input" id="ef-${charId}-${f.id}" rows="4" placeholder="내용을 입력하세요..."></textarea>`
                : `<input class="edit-input" id="ef-${charId}-${f.id}" type="text" placeholder="—">`}
        </div>`).join('')

    const makeImgSection = (mode, label) => `
        <div class="edit-img-section">
            <div class="edit-img-preview" id="edit-imgprev-${charId}-${mode}">
                <span class="edit-img-ph">이미지 없음</span>
            </div>
            <div class="edit-img-btns">
                <button class="edit-img-btn" onclick="triggerImgUpload('${charId}','${mode}')">${label}</button>
                <button class="edit-img-btn edit-img-clear" onclick="clearCharImg('${charId}','${mode}')">제거</button>
            </div>
            <input type="file" id="file-${charId}-${mode}" accept="image/*" style="display:none"
                onchange="handleImgFile('${charId}','${mode}',this)">
            <p class="edit-img-note">최대 1.5MB · JPG / PNG / WebP</p>
        </div>`

    const d = document.createElement('div')
    d.className = 'edit-drawer'
    d.id = 'edit-drawer-' + charId
    d.innerHTML = `
        <div class="edit-overlay" onclick="closeEditPanel('${charId}')"></div>
        <div class="edit-panel">
            <div class="edit-panel-hdr">
                <span class="edit-panel-title">✎ ${name}</span>
                <button class="edit-close-btn" onclick="closeEditPanel('${charId}')">✕</button>
            </div>
            <div class="edit-etabs">
                <button class="etab active" id="etab-${charId}-def" onclick="setEditTab('${charId}','def')">기본</button>
                <button class="etab" id="etab-${charId}-as" onclick="setEditTab('${charId}','as')">Another Style</button>
            </div>
            <div class="edit-scroll">
                <div class="etab-pane" id="etabp-${charId}-def">
                    ${makeImgSection('def', '이미지 업로드')}
                    ${makeFields('def')}
                </div>
                <div class="etab-pane" id="etabp-${charId}-as" style="display:none">
                    ${makeImgSection('as', 'AS 이미지 업로드')}
                    ${makeFields('as')}
                </div>
            </div>
            <div class="edit-actions">
                <button class="edit-save-btn" onclick="saveChar('${charId}')">저장</button>
                <button class="edit-cancel-btn" onclick="closeEditPanel('${charId}')">취소</button>
            </div>
        </div>`
    return d
}

function populateEditPanel(charId) {
    const data = _charCache[charId] || {}
    EDIT_FIELDS.forEach(f => {
        const el = document.getElementById(`ef-${charId}-${f.id}`)
        if (!el) return
        const val = data[f.id]
        if (f.type === 'textarea') {
            el.value = (val || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
        } else {
            el.value = val !== undefined ? val : ''
        }
    })
    updateImgPreview(charId, 'def', data.img_def || '')
    updateImgPreview(charId, 'as',  data.img_as  || '')
    if (!_pendingImg[charId]) _pendingImg[charId] = {}
    setEditTab(charId, 'def')
}

function setEditTab(charId, mode) {
    ;['def', 'as'].forEach(m => {
        const tab  = document.getElementById(`etab-${charId}-${m}`)
        const pane = document.getElementById(`etabp-${charId}-${m}`)
        if (tab)  tab.classList.toggle('active', m === mode)
        if (pane) pane.style.display = m === mode ? '' : 'none'
    })
}

function updateImgPreview(charId, mode, src) {
    const wrap = document.getElementById(`edit-imgprev-${charId}-${mode}`)
    if (!wrap) return
    wrap.innerHTML = src
        ? `<img src="${src}" alt="">`
        : `<span class="edit-img-ph">이미지 없음</span>`
}

function triggerImgUpload(charId, mode) {
    document.getElementById(`file-${charId}-${mode}`)?.click()
}

function handleImgFile(charId, mode, inputEl) {
    const file = inputEl.files[0]
    if (!file) return
    if (file.size > 1_500_000) {
        alert(`이미지가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB).\n1.5MB 이하 이미지를 사용해 주세요.`)
        inputEl.value = ''
        return
    }
    const reader = new FileReader()
    reader.onload = e => {
        if (!_pendingImg[charId]) _pendingImg[charId] = {}
        _pendingImg[charId][mode] = e.target.result
        updateImgPreview(charId, mode, e.target.result)
    }
    reader.readAsDataURL(file)
}

function clearCharImg(charId, mode) {
    if (!_pendingImg[charId]) _pendingImg[charId] = {}
    _pendingImg[charId][mode] = ''
    updateImgPreview(charId, mode, '')
}

async function saveChar(charId) {
    const data = { ...(_charCache[charId] || {}) }

    EDIT_FIELDS.forEach(f => {
        const el = document.getElementById(`ef-${charId}-${f.id}`)
        if (el) data[f.id] = el.value.trim()
    })

    const pi = _pendingImg[charId] || {}
    if (pi.def !== undefined) data.img_def = pi.def
    if (pi.as  !== undefined) data.img_as  = pi.as

    const btn = document.querySelector(`#edit-drawer-${charId} .edit-save-btn`)
    if (btn) { btn.disabled = true; btn.textContent = '저장 중...' }

    try {
        if (_db && _fbSet && _fbRef) {
            await _fbSet(_fbRef(_db, 'chars/' + charId), data)
        } else {
            localStorage.setItem('char-' + charId, JSON.stringify(data))
            applyCharData(charId, data)
        }
        _pendingImg[charId] = {}
        closeEditPanel(charId)
    } catch (e) {
        console.error('저장 실패:', e)
        alert('저장에 실패했습니다. 콘솔을 확인해 주세요.')
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '저장' }
    }
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme()
    initFirebase()
    initASStates()
})

window.showPage         = showPage
window.toggleTheme      = toggleTheme
window.toggleUnlock     = toggleUnlock
window.setPageAS        = setPageAS
window.openEditPanel    = openEditPanel
window.closeEditPanel   = closeEditPanel
window.setEditTab       = setEditTab
window.triggerImgUpload = triggerImgUpload
window.handleImgFile    = handleImgFile
window.clearCharImg     = clearCharImg
window.saveChar         = saveChar
