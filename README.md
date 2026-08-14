# sktstreamer

## why use sktstreamer vs moonlight etc ?
`sktstreamer` is for mainly getting a smooth video especially for open world games, where players prefer to enjoy the view and scenery, while the live preview shows where you are like driving a car in open world games. essentially the main target is for use over **mobile networks** 4g, 5g etc . where you can still get good video. 

so you can drive properly. so you can see both the live preview and the smooth video as well even on slow mobile networks. av1 codec is highly recommended.  .

so it basically shows the smooth video but latency can be higher . there is also a live edge mode that might need experimenting with resolutions etc because if the client runs out of frames nothing can be done as the network itself is not providing. so basically you might put a low resolution like 320 * 240 and upscale it in the UI . spline upscaling is recommended. that way also a live video or even in slow networks it can work. there is a network counter at very last that shows , can be helpful for tuning .
# Quick Start — For Beginners

## 1. Install the requirements

On the **Windows PC you want to stream from**, install:

- **Node.js** — https://nodejs.org/
- **FFmpeg** — https://www.gyan.dev/ffmpeg/builds/

For FFmpeg, download the **Full build**, extract it, and make sure `ffmpeg.exe` can be found from Command Prompt.

## 2. Download the project

Download this repository from GitHub:

https://github.com/sktguha/sktstreamer

Or use Git:

```bash
git clone https://github.com/sktguha/sktstreamer.git
cd sktstreamer
```

## 3. Install the Node.js dependency

Open Command Prompt or PowerShell inside the project folder and run:

```bash
npm install ws
```

## 4. Start the streaming server

Run:

```bash
node ffserver.js
```

The server starts on port `7600`.

## 5. Open the streamer on your phone

The easiest setup is to keep the HTML client on your phone and open it through a tiny local web server.

Install **Simple HTTP Server** on Android:

https://play.google.com/store/apps/details?id=com.phlox.simpleserver

The app can host a folder containing the HTML client over HTTP. citeturn0search1

1. Copy `ffclientu-10f-6-13.html` to your phone.
2. Open **Simple HTTP Server** and select the folder containing the HTML file.
3. Start the server.
4. Open the displayed local address in your phone's browser, usually something like:

```text
http://localhost:PORT/
```

You can also open the HTML file directly if your browser supports it, but using a local HTTP server is recommended.

The HTML client then connects to the streaming server running on your Windows PC.

## 6. Local network play

For normal home Wi-Fi:

Find the Windows PC's local IP:

```bash
ipconfig
```

Look for its **IPv4 Address**, for example:

```text
192.168.1.100
```

The phone and PC must be reachable on the same network.

Use the PC's IP when the client needs to connect to the streaming server:

```text
ws://192.168.1.100:7600/
```

## 7. Remote play with Tailscale

For playing from **outside your home network**, install Tailscale on both the Windows PC and the phone.

Official download:

https://tailscale.com/download/ citeturn0search0turn0search3

Sign both devices into the same Tailscale account/network.

The PC will then have a Tailscale IP, typically in the `100.x.x.x` range.

Use that IP instead of the local `192.168.x.x` address:

```text
ws://100.x.x.x:7600/
```

This lets the phone reach your PC remotely without manually port-forwarding the streaming server.

```text
Game
  ↓
FFmpeg
  ↓
Custom low-latency transport
  ↓
Phone browser
```

You can directly experiment with resolution, FPS, bitrate/CRF, codecs, GOP size, buffering, and other FFmpeg settings.

## 8. Start streaming

Open the web client and use the available controls to start FFmpeg.

Your Windows PC is the **streaming host** and the phone/browser is the **client**.

## Web UI Guide

Open `ffclient.html` in your browser. The UI is designed for controlling the stream, managing latency, using the live JPEG preview, and tuning image quality/upscaling.

### Connection

The main controls include:

- **server** — the FFmpeg/WebSocket server address.
- **connect** — connect to the streaming server.
- **fullscreen** — enter fullscreen.
- **buffer (ms)** — amount of video kept ahead of playback.
- **extra smoothing** — additional playback smoothing.
- **30fps mode** — use 30 FPS playback.
- **clock** — show an on-screen clock.

For slow networks, a little buffer can make playback much smoother. For the lowest practical latency, reduce the buffer and try staying close to the live edge.

### Live JPEG Preview

The **live preview** is a lightweight JPEG view of the current PC/game screen. It is separate from the main video stream, so it can remain useful when the video has latency or the network is struggling.

For example, while driving through an open-world game:

```text
Game movement
     ↓
Video stream has some latency/buffer
     ↓
JPEG preview gets a fresh current frame
     ↓
You can quickly see where the game actually is
```

This is useful on slow networks where **smooth video + a fresh lightweight preview** can be better than trying to make the entire video stream perfectly real-time.

### 👁 Live Preview button

The **👁 button** directly on the video toggles the live-preview panel.

### 🖼 Image Viewer

The **🖼 button** opens the full Image Viewer panel.

The floating panel includes:

- `⟲` — reset position and size
- `⚙` — show/hide preview configuration
- `—` — minimize/hide the panel
- Dragging the header — move the panel
- Resize handle — resize the panel

When minimized, the 🖼 button remains available to bring it back.

### ⌨ Keyboard auto-show/hide

The **⌨ button** controls keyboard-related preview behavior.

The **W + seconds** option can automatically show the preview while an on-screen key is being held.

For example:

```text
Hold W
  ↓
Preview appears

Release W
  ↓
Preview stays briefly
  ↓
Hides after the configured timeout
```

The default timeout is **2 seconds**.

If multiple on-screen keys are being held, the preview does not disappear just because one of them was released.

### Preview configuration

Open **⚙** in the Image Viewer to configure:

- **URL** — JPEG/image endpoint
- **Poll ms** — how often a new JPEG is requested
- **Start** — start polling
- **Stop** — stop polling
- Status
- Last loaded time
- Error status

The default polling interval is **500 ms**.

The preview adds a timestamp to image requests so an old cached JPEG is not reused.

### Preview zoom

The Image Viewer provides:

```text
− Zoom
Reset
+ Zoom
```

Zoom ranges from **25% to 800%**, in 25% steps.

The selected zoom level is remembered by the browser.

This is useful when the JPEG is intentionally very small to save bandwidth. You can enlarge it in the viewer without increasing the amount of data being transmitted.

### Preview color controls

The JPEG viewer has its own image controls:

- **Own color**
- Brightness
- Contrast
- Saturation
- Warmth
- Reset

These controls are separate from the main video's color grading.

### Main video controls

The UI also provides controls for:

- Zoom
- Keyboard controls
- Input profiles
- Mouse/visual controls
- Live preview
- Fullscreen
- Upscale fullscreen

### Color grading

The video UI provides controls such as:

- Brightness
- Contrast
- Saturation
- Hue
- Warmth
- Green boost
- Blue boost
- Red boost
- Shine
- Reflection boost
- Pop

These can be useful when streaming at very low resolution because moderate contrast, saturation, and sharpening can make a small stream look much better.

### Upscaling

The **Upscale & kernel** section provides multiple scaling options, including:

- Catmull-Rom
- Spline36
- Mitchell-Netravali
- Lanczos2
- Bicubic
- Lanczos3
- FSR (EASU + RCAS)
- Detail Recover

You can also change the scale factor, such as `2x`.

The basic slow-network approach is:

```text
Game
 ↓
Low-resolution + low-bitrate encode
 ↓
Slow network
 ↓
Client-side upscaling
 ↓
Phone display
```

This lets you transmit much less data while still displaying a larger image.

Upscaling does not create missing detail, but it can make a deliberately low-resolution stream look substantially better at display size. This is especially useful when bandwidth is the limiting factor.

### Sharpening and detail

The UI also provides sharpening/detail processing such as:

- Detail recovery
- Sharpening
- CAS
- Anti-ringing
- Denoise
- Smoothing

There are lighter and heavier processing options. On a weaker phone, start with a simple scaling method and moderate sharpening.

### Zoom and display

The display controls include:

- Zoom in/out
- Upscale fullscreen
- Preview opacity
- Page font-size controls

### Profiles

The FFmpeg command and upscaler sections support profiles, allowing different configurations to be saved and switched without rebuilding the settings each time.

A useful slow-network profile might look like:

```text
Low-bitrate FFmpeg encode
        ↓
Live JPEG preview
        ↓
2x upscaling
        ↓
Moderate sharpening
        ↓
Smooth open-world gameplay
```

## Remote keyboard and mouse

The project also includes remote keyboard and mouse control.

Start the input server from the project folder using its Node.js server file, then use the browser client to send input to the PC.

The included `key.exe` and `mouse.exe` handle the Windows input through AutoHotkey.

> **Important:** Keep the streaming and input servers on a trusted network. The input server can control your PC.

---

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

### Windows

- Windows
- Node.js
- FFmpeg
- The included `key.exe` and `mouse.exe` for remote keyboard/mouse control

### macOS / Linux

The **streaming part also works on macOS and Linux** as long as Node.js and FFmpeg are available.

The Windows AutoHotkey input executables are Windows-specific, so the remote keyboard/mouse part is not included for those platforms.

### Client

Any modern browser with:

- WebSocket support
- JavaScript
- Video/media decoding support

A phone, tablet, laptop, Mac, Linux PC, or another Windows PC can be used as the client.

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

### Put the client next to the server

Keep the HTML client in the same project folder as `ffserver.js`:

```text
sktstreamer/
├── ffserver.js
├── ffclient.html
├── ...
```

`ffserver.js` expects the client HTML there. The client file is already included in the repository, so normally **you do not need to download or create another one**.

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

## What is this mainly for?

The main idea is **smooth remote play when the network is the problem**.

It is especially useful for games where you mainly want to:

- Look around an open-world game
- Drive around
- Explore
- Watch the game world move smoothly
- Accept a little control latency in exchange for a much smoother video stream

It is **not trying to make latency disappear**.

Instead, the player can stay close to the **live edge** and keep the video moving smoothly even when the network is slow or occasionally stalls.

### Live edge

The client has a **live-edge** mode/control.

Try it when you want the lowest practical delay.

If the network becomes unstable, allowing a little more buffer can make playback much smoother.

The basic trade-off is:

```text
Less buffer  → lower latency
More buffer  → smoother playback
```

## Low bandwidth + upscaling

One of the useful experiments with this project is combining **low-bitrate streaming with upscaling**.

For example, instead of trying to send a large high-resolution video over a weak connection:

```text
Game
 ↓
Low-resolution / low-bitrate encode
 ↓
Network
 ↓
Upscaling
 ↓
Phone display
```

This can make a slow connection usable while still producing a larger, cleaner-looking image on the client.

FFmpeg can be used for different scaling and sharpening pipelines, including fast scaling modes when CPU usage matters.

### Important trade-off

Upscaling **does not create missing detail** and does not reduce the amount of data that must be transmitted by itself.

The benefit is that you can deliberately stream a much smaller image and spend CPU on making that smaller image look better at display size.

So on a very slow network, something like:

```text
360p → upscale → phone display
```

can be more practical than trying to send native-resolution video.

This is particularly useful for the project's target use case: **smooth exploration over a poor connection rather than perfect competitive-gaming latency**.

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

The main use case is **slow or unreliable networks**. You can stream a much smaller, lower-bitrate video and use **upscaling** to make it look better on the client, keeping gameplay smooth when bandwidth is limited.

```text
Game → low-resolution encode → slow network → upscaling → phone display
```

This is especially useful for smoothly exploring and looking around in open-world games where a little control latency is acceptable.

The transport, encoder, buffering, live-edge behavior, and upscaling pipeline can all be experimented with directly.

## Security

The input-control server can control the Windows machine.

**Do not expose it directly to the public internet without authentication and proper network security.**

Use a trusted network, VPN, or another protected transport when appropriate.

## Status

This project is actively experimental.

Configuration, filenames, endpoints, encoding settings, and implementation details may change as streaming experiments continue.

## Repository

https://github.com/sktguha/sktstreamer

```bash
npm install ws
```

## 4. Start the streaming server

Run:

```bash
node ffserver.js
```

The server starts on port `7600`.

## 5. Open the streamer

Find the Windows PC's local IP address:

```bash
ipconfig
```

Look for its **IPv4 Address**, for example:

```text
192.168.1.100
```

On your phone or other client device, open:

```text
http://192.168.1.100:7600/
```

Replace the IP with your PC's actual IP.

## 6. Start streaming

Open the web client and use the available controls to start FFmpeg.

Your PC is now the **streaming host** and the phone/browser is the **client**.

## Remote keyboard and mouse

The project also includes remote keyboard and mouse control.

Start the input server from the project folder using its Node.js server file, then use the browser client to send input to the PC.

The included `key.exe` and `mouse.exe` handle the Windows input through AutoHotkey.

> **Important:** Keep the streaming and input servers on a trusted network. The input server can control your PC.

---

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
