const http = require('http')
const { execFile } = require('child_process')
const path = require('path')
const PORT = Number(process.argv[2]) || 5000;
const AHK = path.join(__dirname, 'key.exe')
const MOUSE_AHK = path.join(__dirname, 'mouse.exe')
const CLICK_AHK = path.join(__dirname, 'click.exe')

// ---- ACCELERATION STATE ----
const timers = {}

// ---- KEYBOARD ----
const sendKey = (key, action) => {
    console.log('KEY:', key, 'ACTION:', action)
    execFile(AHK, [key, action], err => {
        if (err) console.error('EXE ERROR:', err)
    })
}

// ---- MOUSE MOVEMENT (raw passthrough, no logic) ----
function handleMouseRequest(parts, query, res) {
    const dx = Number(parts[1]) || 0
    const dy = Number(parts[2]) || 0
    execFile(MOUSE_AHK, [String(dx), String(dy)], err => {
        if (err) console.error('MOUSE EXE ERROR:', err)
    })
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
}

// ---- MOUSE CLICKS ----
function sendClick(button, action) {
    console.log('CLICK:', button, 'ACTION:', action)
    execFile(CLICK_AHK, [button, action], err => {
        if (err) console.error('CLICK EXE ERROR:', err)
    })
}

function handleClick(button, action, res) {
    const clickAction = action || 'click'
    sendClick(button, clickAction)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
}

// ---- HTTP SERVER ----
http.createServer((req, res) => {
    try {
        const [pathPart, queryString] = req.url.split('?')
        const parts = pathPart.split('/').filter(Boolean)
        const query = {}
        if (queryString) {
            for (const pair of queryString.split('&')) {
                const [k, v] = pair.split('=')
                if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '')
            }
        }

        console.log('URL:', req.url)

        // 1. Mouse movement routing (/mouse/<dx>/<dy>)
        if (parts[0] === 'mouse') {
            return handleMouseRequest(parts, query, res)
        }

        // 2. Click routing
        if (parts[0] === 'leftclick') {
            return handleClick('left', parts[1], res)
        }
        if (parts[0] === 'rightclick') {
            return handleClick('right', parts[1], res)
        }
        if (parts[0] === 'middleclick') {
            return handleClick('middle', parts[1], res)
        }

        // 3. MOUSE ACCELERATION START
        if (parts[0] === 'maccel') {
            const id = query.id || 'default'
            const dx = Number(query.dx) || 0
            const dy = Number(query.dy) || 0
            const accel = Number(query.accel) || 0.1
            const delay = Number(query.delay) || 30

            // Kill existing timer for this id if any
            if (timers[id]) clearTimeout(timers[id])

            let i = 0
            function step() {
                const factor = 1 + accel * i
                execFile(MOUSE_AHK, [String(Math.round(dx * factor)), String(Math.round(dy * factor))], err => err && console.error(err))
                i++
                timers[id] = setTimeout(step, delay)
            }
            step()

            res.writeHead(200, { 'Content-Type': 'text/plain' })
            return res.end('started ' + id)
        }

        // 4. MOUSE ACCELERATION STOP
        if (parts[0] === 'mstop') {
            const id = query.id || 'default'
            if (timers[id]) {
                clearTimeout(timers[id])
                delete timers[id]
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            return res.end('stopped ' + id)
        }

        // 5. Keyboard routing
        const key = parts[0]
        const action = parts[1]
        const time = parts[2]

        if (!key || !action) {
            res.writeHead(400)
            return res.end('missing key or action')
        }

        if (key === 'all' && action === 'up') {
            const keys = [
                ...'abcdefghijklmnopqrstuvwxyz'.split(''),
                ...'0123456789'.split(''),
                'Shift', 'LShift', 'RShift',
                'Ctrl', 'LCtrl', 'RCtrl',
                'Alt', 'LAlt', 'RAlt',
                'LWin', 'RWin',
                'Space', 'Tab', 'Enter', 'Escape', 'Backspace', 'CapsLock',
                'Up', 'Down', 'Left', 'Right',
                'Home', 'End', 'PgUp', 'PgDn', 'Insert', 'Delete',
                'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
                'F13','F14','F15','F16','F17','F18','F19','F20','F21','F22','F23','F24',
                'Numpad0','Numpad1','Numpad2','Numpad3','Numpad4',
                'Numpad5','Numpad6','Numpad7','Numpad8','Numpad9',
                'NumpadDot','NumpadDiv','NumpadMult','NumpadAdd'
            ]
            keys.forEach(k => setTimeout(() => sendKey(k, 'up'), Number(time)))
        }

        sendKey(key, action)

        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('ok')
    } catch (err) {
        console.error(err)
        res.writeHead(500)
        res.end('error')
    }
}).listen(PORT, () => {
    console.log(`listening on ${PORT}`)
})