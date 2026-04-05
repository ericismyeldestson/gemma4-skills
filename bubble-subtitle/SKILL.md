---
name: bubble-subtitle
description: Real-time animated speech bubble subtitles. Records audio and transcribes speech directly in the browser using Web Speech API, displaying comic-style bubbles as you speak.
---

# Bubble Subtitle

IMPORTANT: The ONLY tool you may call is `run_js`. Never call any other action or function name.

## When to activate

Activate when the user wants to:
- Record speech and see bubble subtitles
- Generate bubble animation from a text transcript
- Try the speech bubble subtitle player

## Mode 1 — Live recording (user wants to record audio)

When the user wants to record audio or use the microphone, call `run_js` immediately with:

data = {"mode":"record","lang":"zh-CN"}

Use "lang":"en-US" if the user is speaking English, "lang":"ja-JP" for Japanese, etc.
Default to "zh-CN" unless the user specifies another language.

Do NOT wait for audio. Do NOT ask the user to provide audio. Just call run_js right away.

## Mode 2 — Transcript animation (user provides text with timestamps)

When the user provides a written transcript with timing information, call `run_js` with:

data = {"mode":"play","title":"optional title","duration":TOTAL_SECONDS,"segments":[{"start":0.0,"end":2.5,"text":"spoken text","speaker":"A","position":"left"},{"start":3.1,"end":5.8,"text":"next sentence","speaker":"B","position":"right"}]}

Position rules: one speaker → "center", two speakers → "left"/"right", three+ → cycle "left"/"right"/"top"

## Default behavior

If the user says anything like "start", "try it", "let's go", "bubble subtitle", or asks about this skill — call run_js with mode=record immediately. Do not ask questions first.
