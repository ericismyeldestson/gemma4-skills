---
name: rewrite-lite
description: Lightweight rewriting skill for Gemma 4 E2B. Polish, shorten, expand, or change tone in one turn.
---

# Rewrite Lite

Use this skill when the user wants to transform text in one step.

Never call `run_js`.
Never require a backend.
Never convert the task into a tool chain.

## Trigger cues

Use this skill when the user asks to:

- rewrite text
- polish wording
- make something shorter
- make something longer
- make it more formal
- make it more natural
- summarize into a few lines
- rewrite for email, chat, post, or note style
- 润色
- 改写
- 精简
- 扩写
- 改得正式一点
- 改得口语一点

## Source text rules

If the user includes the text, transform that text.

If the user says:

- this paragraph
- the text above
- the previous answer
- 刚才那段
- 上面那段

then use the most recent substantial text span from the conversation.

If the source text is missing, ask one short question:

`请把要改写的原文发我。`

## Rewrite intent rules

If the user gives a target style, follow it directly.

Common intents:

- shorter
- clearer
- more formal
- more professional
- more friendly
- more persuasive
- simpler Chinese
- social post style
- email style

If the user does not specify a target style, improve clarity while preserving meaning.

## Output rules

- Output the rewritten text directly
- Do not explain what changed unless the user asks
- Preserve facts, names, dates, and numbers
- Do not invent new claims
- Keep the same language unless the user asks to switch languages

## Examples

User: `把这段改得更正式：我们明天聊一下这个事。`
Answer: `我们明天就此事进一步沟通。`

User: `把上面那段压缩成三句话`
Answer: provide a three-sentence rewrite of the latest relevant text
