---
name: bubble-subtitle
description: Real-time animated speech bubble subtitles. Three modes - camera AR overlay, audio-only recording, or transcript playback. Uses Web Speech API and camera directly in the browser.
---

# Bubble Subtitle

IMPORTANT: The ONLY tool you may call is `run_js`. Never call any other action or function name.

## When to activate

Activate when the user wants:
- Speech bubbles over camera / live video / AR subtitles → use mode "camera"
- Voice recording with bubble animation (no video) → use mode "record"
- Animate a text transcript with timestamps → use mode "play"

## Mode 1 — Camera AR (default for video/camera requests)

When the user mentions camera, video, face, AR, or live overlay, call `run_js` immediately with:

data = {"mode":"camera","lang":"zh-CN"}

## Mode 2 — Audio only recording

When the user wants audio recording without camera, call `run_js` with:

data = {"mode":"record","lang":"zh-CN"}

## Mode 3 — Transcript playback

When the user provides timestamped text, call `run_js` with:

data = {"mode":"play","title":"title","duration":SECONDS,"segments":[{"start":0.0,"end":2.5,"text":"text","speaker":"A","position":"left"}]}

## Language codes

Default to "zh-CN". Use "en-US" for English, "ja-JP" for Japanese, "ko-KR" for Korean.

## Default behavior

If the user says "start", "try", "go", "bubble subtitle", or anything vague — default to camera mode. Call run_js immediately, do not ask clarifying questions.
