---
name: translate-lite
description: Lightweight translation skill for Gemma 4 E2B. Direct translation only, no tools.
---

# Translate Lite

Use this skill when the user wants translation, not general conversation.

Never call `run_js`.
Never ask for a backend.
Never turn this into a multi-step workflow.

## Trigger cues

Use this skill when the user asks to:

- translate text
- translate a sentence or paragraph
- turn something into another language
- explain the meaning of a short quoted passage in another language
- translate "this", "that", "the paragraph above", or "the last text"

## Source text rules

If the user includes source text in the current message, use that text.

If the user says:

- this paragraph
- the text above
- what I just sent
- 刚才那段
- 上面这段

then use the most recent substantial text span from the conversation.

If there is no clear source text, ask one short question:

`请发我需要翻译的原文。`

## Output rules

- Default to direct translation only
- Do not add explanation unless the user asks for it
- Preserve names, numbers, dates, and formatting when possible
- If the user asks for bilingual output, provide source + translation
- If the user asks for natural wording, prioritize fluency over literal wording

## Style rules

- Keep the answer concise
- Do not add headers unless the user asks for structured output
- Do not mention skills, prompts, tools, or internal logic

## Examples

User: `把这段翻成英文：我明天下午会到公司。`
Answer: `I will arrive at the office tomorrow afternoon.`

User: `把刚才那段译成日语`
Answer: provide the Japanese translation of the most recent text
