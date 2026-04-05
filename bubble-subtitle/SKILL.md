---
name: bubble-subtitle
description: 将音频/视频中的语音转写为带时间戳的气泡字幕动画，支持多人对话识别与漫画气泡风格展示
---

# Bubble Subtitle（气泡字幕）

将语音内容转写为动态气泡字幕，像漫画对话框一样逐句展示字幕内容。

## 触发条件

用户上传音频或视频文件，或请求"生成气泡字幕"、"帮我做字幕动画"时触发本技能。

## 你的工作步骤

1. **仔细分析**用户提供的音频/视频中的所有语音内容
2. **转写文字**，精确记录每句话的起止时间（精确到 0.1 秒）
3. **识别说话人**，用字母标记（A、B、C…），整个对话中保持一致
4. **分配位置**，决定每位说话人的气泡显示位置：
   - 只有一人：`"center"`
   - 两人对话：第一位 `"left"`，第二位 `"right"`
   - 三人以上：循环使用 `"left"`、`"right"`、`"top"`
5. **调用 `run_js`** 工具（script: index.html），传入结构化数据

## run_js 调用格式

`data` 参数必须是如下格式的 JSON 字符串（不要换行）：

```
{"title":"内容标题","duration":总秒数,"segments":[{"start":0.0,"end":2.5,"text":"转写的文字","speaker":"A","position":"left"},{"start":3.1,"end":5.8,"text":"另一句话","speaker":"B","position":"right"}]}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 可选，内容标题 |
| duration | number | 音频/视频总时长（秒） |
| segments[].start | number | 该句开始时间（秒，精确0.1s） |
| segments[].end | number | 该句结束时间（秒，精确0.1s） |
| segments[].text | string | 转写文字内容 |
| segments[].speaker | string | 说话人标记（A/B/C/D） |
| segments[].position | string | 气泡位置（left/right/center/top） |

## 转写规范

- 每个片段建议 1～8 秒，超过 8 秒的长句可在自然停顿处拆分
- 静音段不需要填充，两个 segment 之间可以有间隔
- 如果用户直接提供带时间戳的文字稿，按格式整理后直接输出即可
- 多语言内容按原语言转写，不要翻译
