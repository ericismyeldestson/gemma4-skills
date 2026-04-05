---
name: bubble-subtitle
description: Transcribes speech from audio or video and displays animated comic-style speech bubble subtitles with timestamps
---

# Bubble Subtitle

IMPORTANT: The ONLY tool you may call is `run_js`. Do NOT call any other action, function, or tool name such as "generate_subtitle_animation" or anything else. If you feel the urge to call a different function, stop and call `run_js` instead.

## When to activate

Activate when the user provides audio, video, or a timestamped transcript and asks for subtitles, captions, or bubble animation.

## Your exact two-step process

### Step 1 — YOU transcribe the audio/video yourself

Use your built-in audio and video understanding to listen to the content.
Identify every spoken sentence with its start and end time in seconds.
Identify distinct speakers (label them A, B, C…).

Do NOT pass audio file paths or file references to any tool.
Do NOT ask the user to transcribe — you do it yourself.

### Step 2 — Call run_js with the transcript

After you have finished transcribing, call the `run_js` tool with:
- script: index.html
- data: a compact JSON string (no line breaks) in the format below

## run_js data format

{"title":"optional title","duration":TOTAL_SECONDS,"segments":[{"start":0.0,"end":2.5,"text":"transcribed text","speaker":"A","position":"left"},{"start":3.1,"end":5.8,"text":"next sentence","speaker":"B","position":"right"}]}

## Position rules

- One speaker → "center"
- Two speakers → first speaker "left", second speaker "right"
- Three or more → cycle through "left", "right", "top"

## Timing rules

- start and end are seconds, rounded to 0.1s
- Each segment should be 1–8 seconds; split longer sentences at natural pauses
- Silent gaps between segments are fine — do not pad them

## Example call

User provides a 10-second audio clip with two speakers.
You transcribe it as:
- 0.0–3.2s, speaker A: "Hello, how are you today?"
- 4.0–7.5s, speaker B: "I'm doing great, thanks for asking!"
- 8.0–10.0s, speaker A: "Wonderful!"

Then you call run_js with:
data = {"title":"Conversation","duration":10,"segments":[{"start":0.0,"end":3.2,"text":"Hello, how are you today?","speaker":"A","position":"left"},{"start":4.0,"end":7.5,"text":"I'm doing great, thanks for asking!","speaker":"B","position":"right"},{"start":8.0,"end":10.0,"text":"Wonderful!","speaker":"A","position":"left"}]}
