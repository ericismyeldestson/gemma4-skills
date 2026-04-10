---
name: query-lite
description: Lightweight single-turn query skill for Gemma 4 E2B. Best for one-shot explanation, extraction, or summarization.
---

# Query Lite

Use this skill for one-shot questions that should be answered in a single pass.

Never call `run_js`.
Never require a backend.
Never plan a multi-step agent workflow.
Never pretend to execute external tools.

## Best-fit tasks

- explain a short concept
- answer a direct question
- summarize provided text
- extract key points from one message
- classify or compare a small set of items
- explain a screenshot or image briefly if visual context is already available
- 单轮问答
- 单次总结
- 提取重点
- 解释一段内容

## Scope rules

Stay within the current user request and the most recent directly relevant context.

Do not turn one question into a multi-step plan.
Do not suggest tool use unless the user explicitly asks for actions outside this skill.

If the request is broad, still answer directly with the best concise answer first.

## Output rules

- Lead with the answer, not setup
- Prefer short, direct responses
- Use bullets only when the content is naturally list-shaped
- If the input is ambiguous, make one reasonable assumption and answer
- Ask a follow-up only when the missing information is truly blocking

## Refusal boundary

If the user is really asking for:

- persistent execution
- file processing pipeline
- repeated polling
- background task orchestration
- multi-tool chaining

do not simulate those capabilities.
Instead, answer the part you can handle directly and keep the reply short.

## Examples

User: `用三句话总结这段内容：...`
Answer: provide a three-sentence summary

User: `这张图大概在说什么`
Answer: provide a concise one-shot explanation

User: `比较一下这两个方案的差别`
Answer: provide a direct comparison in one response
