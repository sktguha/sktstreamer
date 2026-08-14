// ffserver.js — spawns ffmpeg, pipes its stdout (fragmented MP4) straight to
// a single WebSocket client, in real time, as bytes arrive. No segment
// files, no polling, no hand-rolled WS framing (uses the `ws` npm package).
//
//   npm install ws
//   node ffserver.js [--port=7600]
//
// Only ONE client is ever served. If a second browser tab/connection comes
// in while one is already active, the OLD socket is terminated immediately
// and the new one takes over. This is enforced at the WS layer, independent
// of the ffmpeg process itself (starting/stopping ffmpeg doesn't affect who
// is "the" client, and vice versa).
//
// Control API (same-origin JSON, also usable from a different origin thanks
// to the CORS headers below):
//   GET  /control/state              -> { running, cmd, hasClient, pid }
//   POST /control/start  { cmd }     -> spawns ffmpeg with `cmd` (full shell
//                                        command string, e.g. "ffmpeg -f ...")
//   POST /control/stop               -> kills ffmpeg if running
//   POST /control/restart { cmd }    -> stop, then start with `cmd`
//
// ffmpeg itself is spawned with stdio: ['ignore', 'pipe', 'inherit'] --
// stdout is piped (that's the video data), stderr is 'inherit' so ffmpeg's
// normal progress/error chatter shows up directly in this same terminal,
// same pattern as bsmartc.js's --autoRestart watchdog. No detached/phantom
// process trick is used here on purpose: ffmpeg's lifetime is tied 1:1 to
// this server process, and killing/restarting it is always an explicit,
// visible action from the control API.
//
// ---------------------------------------------------------------------
// BACKPRESSURE FIX (see comments below near `startFfmpeg` / stdout wiring):
// The original version called ws.send() on every stdout chunk with no
// regard for whether the client's socket could actually drain that fast.
// Node just queues bytes into the WS's internal send buffer forever, which
// especially at short (1s) keyframe intervals -- where a fat IDR-frame
// fragment shows up once a second -- causes visible stutter: the queue
// looks "empty" for a while then dumps a backlog all at once.
//
// The fix here does NOT drop chunks (that would slice an MP4 box mid-way
// and corrupt the fragment for the client's demuxer -- much worse than
// stutter, would look like decode garbage/freeze). Instead it applies real
// backpressure: when ws.bufferedAmount is above a threshold, we PAUSE
// reading from ffmpeg's stdout entirely. Node's own pipe backpressure then
// naturally stalls ffmpeg's writes to its stdout, which stalls the
// encoder, which is exactly the "slow the source down" behavior we want --
// no drops, no corruption, just the whole pipeline breathing together.
// ---------------------------------------------------------------------

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// ---------- args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const i = a.indexOf('=');
    return i === -1 ? [a.replace(/^--/, ''), true] : [a.slice(2, i), a.slice(i + 1)];
  })
);
const PORT = parseInt(args.port || '7600', 10);

// Backpressure tuning. HIGH_WATER: pause stdout reads once the WS send
// buffer exceeds this many bytes. LOW_WATER: resume once it drains back
// below this. Two thresholds (instead of one) avoid rapid pause/resume
// flapping right at a single boundary value.
const HIGH_WATER = parseInt(args.highWater || (256 * 1024), 10);  // 256KB
const LOW_WATER  = parseInt(args.lowWater  || (64 * 1024), 10);   //  64KB

// Log bufferedAmount at most this often (ms), so diagnostics don't spam
// the terminal on every single stdout chunk.
const BUFFER_LOG_INTERVAL_MS = 500;

function ts() {
  return new Date().toISOString().split('T')[1].replace('Z', '');
}
function log(...a) {
  console.log(`[${ts()}]`, ...a);
}

// ================= ffmpeg process management =================

let ffmpegProc = null;
let lastCmd = '';

// Splits a command string the way a shell would (handles quoted args so
// filter_complex expressions etc. with spaces/semicolons survive intact),
// without actually invoking a shell. First token is the executable
// (normally just "ffmpeg" -- resolved via PATH, matches the existing zw.js
// assumption that ffmpeg.exe/ffmpeg is already on PATH).
function splitCommand(cmd) {
  const parts = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      if (c === quote) { quote = null; }
      else { cur += c; }
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (/\s/.test(c)) {
      if (cur) { parts.push(cur); cur = ''; }
    } else {
      cur += c;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

function stopFfmpeg() {
  if (!ffmpegProc) return;
  log(`stopping ffmpeg (pid=${ffmpegProc.pid})`);
  const proc = ffmpegProc;
  ffmpegProc = null;
  try { proc.kill('SIGTERM'); } catch (e) { /* already dead */ }
}

// Tracks whether we've currently paused reading from this ffmpeg's stdout
// due to backpressure, and the last time we logged bufferedAmount, so the
// data handler (called many times/sec) can throttle its own logging.
let stdoutPaused = false;
let lastBufferLogAt = 0;

function startFfmpeg(cmd) {
  if (ffmpegProc) stopFfmpeg();
  lastCmd = cmd;
  stdoutPaused = false;
  lastBufferLogAt = 0;
  const argv = splitCommand(cmd);
  const exe = argv[0];
  const rest = argv.slice(1);
  log(`starting: ${exe} ${rest.join(' ')}`);

  // stdio: stdout is 'pipe' (video bytes, handled below), stderr is
  // 'inherit' so ffmpeg's own logging shows up directly in this terminal.
  const proc = spawn(exe, rest, { stdio: ['ignore', 'pipe', 'inherit'] });
  ffmpegProc = proc;

  proc.stdout.on('data', (chunk) => {
    if (!currentClient || currentClient.readyState !== WebSocket.OPEN) {
      // No client connected -- bytes are simply dropped. This is a live
      // feed, not a buffered one; there is deliberately no backlog to
      // replay for a client that isn't there.
      return;
    }

    currentClient.send(chunk, { binary: true });

    const buffered = currentClient.bufferedAmount;

    // Throttled diagnostic log -- lets you watch bufferedAmount live while
    // reproducing stutter, without flooding the console.
    const now = Date.now();
    if (now - lastBufferLogAt >= BUFFER_LOG_INTERVAL_MS) {
      lastBufferLogAt = now;
      log(`ws.bufferedAmount=${buffered} bytes (chunk=${chunk.length} bytes, paused=${stdoutPaused})`);
    }

    // Backpressure: if the client's send buffer is backing up beyond the
    // high-water mark, stop reading more from ffmpeg's stdout. Node's pipe
    // then applies backpressure to ffmpeg itself (its writes to stdout
    // will block once its OS pipe buffer fills), which slows the encoder
    // down at the source -- no chunk is ever dropped or corrupted.
    if (!stdoutPaused && buffered > HIGH_WATER) {
      stdoutPaused = true;
      proc.stdout.pause();
      log(`PAUSED stdout: bufferedAmount=${buffered} > HIGH_WATER=${HIGH_WATER}`);

      // Poll bufferedAmount until it drains back under LOW_WATER, then
      // resume. We poll (rather than relying on a single event) because
      // ws's bufferedAmount isn't event-driven -- there's no
      // "drained" callback for a specific threshold, only a raw counter
      // that decreases as the OS socket flushes data out.
      const resumeCheck = setInterval(() => {
        if (!ffmpegProc || ffmpegProc !== proc) {
          // ffmpeg was stopped/restarted while we were paused -- bail out,
          // nothing to resume.
          clearInterval(resumeCheck);
          return;
        }
        const nowBuffered = currentClient && currentClient.readyState === WebSocket.OPEN
          ? currentClient.bufferedAmount
          : 0;
        if (nowBuffered <= LOW_WATER) {
          clearInterval(resumeCheck);
          stdoutPaused = false;
          proc.stdout.resume();
          log(`RESUMED stdout: bufferedAmount=${nowBuffered} <= LOW_WATER=${LOW_WATER}`);
        }
      }, 50);
    }
  });

  proc.on('exit', (code, signal) => {
    log(`ffmpeg exited (code=${code}, signal=${signal})`);
    if (ffmpegProc === proc) ffmpegProc = null;
    stdoutPaused = false;
  });

  proc.on('error', (err) => {
    log(`ffmpeg spawn error: ${err.message}`);
    if (ffmpegProc === proc) ffmpegProc = null;
    stdoutPaused = false;
  });

  return proc;
}

// ================= single-client WebSocket =================
//
// currentClient holds the one live socket, if any. On a new incoming
// connection, whatever is currently in currentClient is terminated
// immediately (not gracefully closed -- terminate() drops it right away)
// before the new one takes its place. This is the whole eviction policy:
// simple, and correct as long as it's the only place currentClient is ever
// assigned.

let currentClient = null;

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(CLIENT_HTML);
    return;
  }

  if (pathname === '/control/state' && req.method === 'GET') {
    sendJson(res, 200, {
      running: !!ffmpegProc,
      pid: ffmpegProc ? ffmpegProc.pid : null,
      cmd: lastCmd,
      hasClient: !!(currentClient && currentClient.readyState === WebSocket.OPEN),
      bufferedAmount: currentClient ? currentClient.bufferedAmount : null,
      stdoutPaused,
    });
    return;
  }

  if (pathname === '/control/start' && req.method === 'POST') {
    readJsonBody(req).then((body) => {
      const cmd = (body.cmd || '').trim();
      if (!cmd) { sendJson(res, 400, { error: 'cmd is required' }); return; }
      startFfmpeg(cmd);
      sendJson(res, 200, { message: 'started', cmd });
    }).catch((e) => sendJson(res, 400, { error: `invalid JSON body: ${e.message}` }));
    return;
  }

  if (pathname === '/control/stop' && req.method === 'POST') {
    stopFfmpeg();
    sendJson(res, 200, { message: 'stopped' });
    return;
  }

  if (pathname === '/control/restart' && req.method === 'POST') {
    readJsonBody(req).then((body) => {
      const cmd = (body.cmd || lastCmd || '').trim();
      if (!cmd) { sendJson(res, 400, { error: 'cmd is required (none previously set)' }); return; }
      startFfmpeg(cmd); // startFfmpeg() itself stops any existing process first
      sendJson(res, 200, { message: 'restarted', cmd });
    }).catch((e) => sendJson(res, 400, { error: `invalid JSON body: ${e.message}` }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(body);
}

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
  // Evict whoever's currently connected -- strictly one live client, no
  // exceptions. terminate() (not close()) drops the old socket immediately
  // rather than waiting on a close handshake, so there's never a window
  // where two sockets are both considered "current".
  if (currentClient) {
    log('evicting previous client for new connection');
    try { currentClient.terminate(); } catch (e) { /* already gone */ }
  }
  currentClient = ws;
  log(`client connected: ${req.socket.remoteAddress}`);

  // New client means any previous pause state is stale (old socket's
  // buffer is gone). If ffmpeg is running and its stdout was paused for
  // the old client, resume it fresh for the new one.
  if (stdoutPaused && ffmpegProc) {
    stdoutPaused = false;
    ffmpegProc.stdout.resume();
    log('resumed stdout for new client (previous pause state cleared)');
  }

  ws.on('close', () => {
    if (currentClient === ws) {
      currentClient = null;
      log('client disconnected');
    }
    // else: this was an already-evicted socket finishing its close, the
    // slot belongs to a newer client now -- nothing to do.
  });
  ws.on('error', () => {
    if (currentClient === ws) currentClient = null;
  });
});

// ================= inline HTML client =================
const CLIENT_HTML = require('fs').readFileSync(path.join(__dirname, 'ffclient.html'), 'utf8');

httpServer.listen(PORT, () => {
  log(`listening on 0.0.0.0:${PORT}`);
  log(`open http://<this-pc-ip>:${PORT}/ , paste an ffmpeg command, click Start`);
});
