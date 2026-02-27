

# Plan: Improve AI Agent Responses

## Problem
1. AI gives overly long answers and talks about topics the user didn't ask about
2. Raw markdown symbols (**, ###, etc.) are displayed as plain text instead of being rendered

## Changes

### 1. Update system prompt in `supabase/functions/chat/index.ts`
Rewrite the system prompt to enforce concise, human-like communication:
- Answer ONLY what was asked, no unsolicited advice
- Keep responses short (3-5 sentences for simple questions, longer only when explicitly asked)
- Do NOT use markdown headers (###), do NOT use asterisks for lists
- Use plain text with bold (`<b>`) only for key terms
- Speak like a friendly knowledgeable person, not a textbook

### 2. Add markdown rendering in `src/pages/AskAI.tsx`
- Install `react-markdown` dependency
- Replace plain `<p>` tag with `<ReactMarkdown>` component to properly render bold text, lists, etc.
- Style the rendered markdown to look clean (no raw symbols visible)

### Technical Details

**System prompt changes (chat edge function):**
- Add explicit instructions: "Отвечай ТОЛЬКО на заданный вопрос. Не добавляй информацию, о которой не спрашивали."
- Add format rules: "Не используй заголовки (###). Не используй маркированные списки со звёздочками. Пиши обычным текстом. Выделяй ключевые слова жирным."
- Add length constraint: "Будь краток: 3-5 предложений для простых вопросов. Давай развёрнутый ответ только если пользователь явно просит подробности."

**Frontend changes (AskAI.tsx):**
- Add `react-markdown` package
- Wrap assistant message content in `<ReactMarkdown>` with appropriate prose styling
- This will render `**bold**` as actual bold text instead of showing asterisks
