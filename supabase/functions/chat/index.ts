import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://polza.ai/api/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const POLZA_AI_API_KEY = Deno.env.get("POLZA_AI_API_KEY");
    if (!POLZA_AI_API_KEY) throw new Error("POLZA_AI_API_KEY is not configured");
    const POLZA_AI_MODEL = Deno.env.get("POLZA_AI_MODEL") || "google/gemini-3.1-flash-lite-preview";

    const { messages, profile } = await req.json();

    const systemPrompt = `Ты — дружелюбный AI-консультант по здоровью и wellness. Отвечай на русском языке.

ПРАВИЛА ОБЩЕНИЯ:
- Отвечай ТОЛЬКО на заданный вопрос. Не добавляй информацию, о которой не спрашивали.
- Будь краток: 3-5 предложений для простых вопросов. Давай развёрнутый ответ только если пользователь явно просит подробности.
- Говори как знающий друг, а не как учебник. Без канцелярита и формальностей.
- Не используй заголовки (###, ##). Не используй маркированные списки со звёздочками (*).
- Пиши обычным текстом. Выделяй **ключевые слова** жирным, если нужно.
- Если нужен список, используй нумерацию (1, 2, 3) или тире (—).
- Основывай рекомендации на доказательной медицине.
- Если вопрос выходит за рамки компетенции, кратко рекомендуй обратиться к врачу.

Профиль пользователя:
- Имя: ${profile?.name || "Не указано"}
- Пол: ${profile?.gender === "male" ? "мужской" : profile?.gender === "female" ? "женский" : "другой"}
- Возраст: ${profile?.age || "?"} лет
- Рост: ${profile?.height || "?"} см, Вес: ${profile?.weight || "?"} кг
- Уровень: ${profile?.fitnessLevel || "beginner"}
- Цель: ${profile?.goal || "не указана"}
- Тип диеты: ${profile?.dietType || "без ограничений"}
- Ограничения: ${profile?.dietPreferences?.join(", ") || "нет"}
- Место тренировки: ${profile?.workoutLocation === "home" ? "дома" : "зал"}
- Жалобы: ${profile?.complaints || "нет"}`;

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POLZA_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: POLZA_AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Подождите немного." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Исчерпан лимит AI-запросов." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", status, body);
      return new Response(JSON.stringify({ error: "Ошибка AI-сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
