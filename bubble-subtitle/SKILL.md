---
name: bubble-subtitle
description: AR speech bubbles with face tracking, camera vision analysis, audio capture, and transcript playback.
---

# Bubble Subtitle Agent

CRITICAL: The ONLY tool you may call is `run_js`. Never call any other action or function name. Never call `generate_subtitle_animation` or anything else.

## Modes

You have 5 modes. Pick the right one based on user intent, then call `run_js` **immediately** — never ask questions first.

### Mode 1 — Camera AR (interactive)

Opens full-screen camera with face-tracked speech bubbles.

Trigger: user says camera, video, AR, face, live, 摄像头, 视频, 开始, start, go, try, or anything vague.

```json
{"mode":"camera","lang":"zh-CN"}
```

### Mode 2 — Record (interactive)

Opens audio-only recording with animated bubbles. No camera.

Trigger: user says record, audio only, 录音, 仅录音, no camera.

```json
{"mode":"record","lang":"zh-CN"}
```

### Mode 3 — Play (interactive)

Plays back a timestamped transcript with animated bubbles.

Trigger: user provides text with timestamps or asks to play/replay a transcript.

```json
{"mode":"play","title":"Demo","duration":30,"segments":[{"start":0,"end":3,"text":"Hello","speaker":"A","position":"left"}]}
```

### Mode 4 — Snapshot (headless, returns image)

Captures one camera frame and returns it to you as an image. You will SEE the photo. Use this to answer "what do you see" or analyze surroundings.

Trigger: user says look, see, 看看, 拍照, what's in front of me, describe, analyze scene.

```json
{"mode":"snapshot","camera":"user"}
```

After receiving the image, describe what you see in natural language.

### Mode 5 — Listen (headless, returns text)

Records audio for N seconds, transcribes it on-device, and returns the text to you. Use this when you need to hear the user without opening a full UI.

Trigger: user says listen, hear, 听, 听一下, what am I saying.

```json
{"mode":"listen","seconds":5,"lang":"zh-CN"}
```

After receiving the transcription, respond to what the user said.

## Chaining modes

You can call run_js multiple times to combine capabilities:

- **Describe surroundings**: snapshot → read the image → respond
- **Voice conversation**: listen → read transcription → respond with text
- **Narrated AR**: snapshot first to understand scene → then camera for live bubbles
- **Smart subtitles**: listen → understand topic → camera with context

## Language codes

Default: `zh-CN`. English: `en-US`. Japanese: `ja-JP`. Korean: `ko-KR`.

## Rules

1. ALWAYS call `run_js` immediately. Never say "I can't do this."
2. If intent is unclear, default to camera mode.
3. Never invent tool names. Only `run_js` exists.
4. One `run_js` call per response. Wait for the result before calling again.
5. For snapshot/listen: after receiving the result, respond in natural language.
