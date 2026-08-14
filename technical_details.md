# sktstreamer

A lightweight Windows game-streaming system built around **FFmpeg, Node.js, WebSockets, and a browser client**, with remote keyboard and mouse control through AutoHotkey.

> Experimental project focused on low-latency PC game streaming and direct control over the capture, encoding, transport, and input pipeline.

## Architecture

```text
Windows PC
│
├── FFmpeg
│    └── Video stream
│          │
│          ▼
│      WebSocket
│          │
│          ▼
│     Browser / Phone
│
└── Node.js input server
     │
     ├── Keyboard → key.exe
     └── Mouse    → mouse.exe
                       │
                       ▼
                    AutoHotkey
```

## Features

- FFmpeg-based video streaming
- WebSocket transport
- Browser-based client
- Low-latency streaming design
- Configurable FFmpeg commands
- Remote keyboard input
- Remote mouse movement
- Mouse buttons and acceleration
- AutoHotkey-based Windows input
- FFmpeg process control
- Designed for experimentation with different codecs, resolutions, frame rates, and encoding settings

## Files

| File | Purpose |
|---|---|
| `ffserver.js` | Main FFmpeg/WebSocket streaming server |
| `ffclientu-10f-6-13.html` | Browser streaming client |
| `server (1).js` | Keyboard/mouse HTTP control server |
| `key.ahk` | AutoHotkey keyboard implementation |
| `key.exe` | Compiled keyboard controller |
| `mouse.ahk` | AutoHotkey mouse implementation |
| `mouse.exe` | Compiled mouse controller |
| `keyconfigexample.txt` | Keyboard configuration example |
| `ffmpedSixResCmd` | FFmpeg command reference |
| `powershellcmdQuarter` | PowerShell command reference |

## Requirements

### Windows PC

- Windows
- Node.js
- FFmpeg
- The included `key.exe` and `mouse.exe`

### Client

Any modern browser with:

- WebSocket support
- JavaScript
- Video/media decoding support

A phone, tablet, laptop, or another PC can be used as the client.

## Installation

Clone the repository:

```bash
git clone https://github.com/sktguha/sktstreamer.git
cd sktstreamer
```

Install the Node.js dependency:

```bash
npm install ws
```

Make sure `ffmpeg.exe` is available either in your PATH or wherever the server expects it.

## Streaming Server

Start:

```bash
node ffserver.js
```

The streaming server uses port `7600`.

Open the client from another device:

```text
http://<PC-IP>:7600/
```

The browser client communicates with the Node.js server through WebSocket.

## FFmpeg

The project is intentionally command-driven so different FFmpeg configurations can be tested easily.

Examples of things that can be changed:

- H.264
- AV1
- NVIDIA NVENC
- SVT-AV1
- Resolution
- FPS
- CRF / bitrate
- GOP / keyframe interval
- FFmpeg filters

See `ffmpedSixResCmd` for command experiments and examples.

## Remote Input

The input server provides HTTP endpoints for sending keyboard and mouse events to Windows.

The Node.js server launches:

```text
key.exe
mouse.exe
```

The executables are compiled from:

```text
key.ahk
mouse.ahk
```

### Keyboard

Example:

```text
/w/down
/w/up
```

### Mouse movement

Example:

```text
/mouse/20/-10
```

### Mouse buttons

Examples:

```text
/leftclick/click
/rightclick/click
/middleclick/click
```

### Mouse acceleration

The input server also supports starting and stopping accelerated mouse movement.

See the source code and configuration example for the current endpoint format.

## Design Goals

The project focuses on:

1. Low latency
2. Minimal unnecessary buffering
3. Fast recovery from network problems
4. Direct FFmpeg control
5. Browser compatibility
6. Remote game input
7. Easy experimentation

This is an experimental streaming stack rather than a replacement for mature solutions such as Moonlight or Parsec.

## Security

The input-control server can control the Windows machine.

**Do not expose it directly to the public internet without authentication and proper network security.**

Use a trusted network, VPN, or another protected transport when appropriate.

## Status

This project is actively experimental.

Configuration, filenames, endpoints, encoding settings, and implementation details may change as streaming experiments continue.

## Repository

https://github.com/sktguha/sktstreamer
