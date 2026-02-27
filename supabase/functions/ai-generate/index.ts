import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function buildSystemPrompt(profile: any): string {
  return `Ты — AI-консультант по здоровью и wellness, работающий на основе доказательной медицины (РКИ, физиология, клиническая нутрициология).

Профиль пользователя:
- Имя: ${profile.name || "Не указано"}
- Пол: ${profile.gender === "male" ? "мужской" : profile.gender === "female" ? "женский" : "другой"}
- Возраст: ${profile.age} лет
- Рост: ${profile.height} см, Вес: ${profile.weight} кг
- Уровень подготовки: ${profile.fitnessLevel}
- Цель: ${profile.goal}
- Тип диеты: ${profile.dietType || "без ограничений"}
- Пищевые ограничения: ${profile.dietPreferences?.join(", ") || "нет"}
- Место тренировки: ${profile.workoutLocation === "home" ? "дома" : "зал"}
- Отслеживание цикла: ${profile.trackCycle ? "да" : "нет"}
- Жалобы: ${profile.complaints || "нет"}

Все ответы давай на русском языке. Будь конкретным и практичным.`;
}

const toolSchemas: Record<string, any> = {
  workouts: {
    name: "generate_workouts",
    description: "Генерация недельного плана тренировок",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", description: "День недели (Пн, Вт, ...)" },
              type: { type: "string", description: "Тип тренировки" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "string", description: "Подходы × повторения" },
                  },
                  required: ["name", "sets"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day", "type", "exercises"],
            additionalProperties: false,
          },
        },
      },
      required: ["days"],
      additionalProperties: false,
    },
  },
  meals: {
    name: "generate_meals",
    description: "Генерация 7-дневного плана питания",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dayName: { type: "string" },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string" },
                    meal: { type: "string" },
                    items: { type: "array", items: { type: "string" } },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    fat: { type: "number" },
                    carbs: { type: "number" },
                    prepTime: { type: "string" },
                  },
                  required: ["time", "meal", "items", "calories", "protein", "fat", "carbs"],
                  additionalProperties: false,
                },
              },
            },
            required: ["dayName", "meals"],
            additionalProperties: false,
          },
        },
      },
      required: ["days"],
      additionalProperties: false,
    },
  },
  supplements: {
    name: "generate_supplements",
    description: "Рекомендации по добавкам",
    parameters: {
      type: "object",
      properties: {
        supplements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              dose: { type: "string" },
              timing: { type: "string" },
              duration: { type: "string" },
              reason: { type: "string" },
            },
            required: ["name", "dose", "timing", "duration", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["supplements"],
      additionalProperties: false,
    },
  },
  shopping: {
    name: "generate_shopping",
    description: "Список покупок по категориям",
    parameters: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              items: { type: "array", items: { type: "string" } },
            },
            required: ["category", "items"],
            additionalProperties: false,
          },
        },
      },
      required: ["categories"],
      additionalProperties: false,
    },
  },
  sos: {
    name: "generate_sos",
    description: "Персональный протокол SOS",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
        supplements: { type: "array", items: { type: "string" } },
        note: { type: "string" },
      },
      required: ["title", "steps"],
      additionalProperties: false,
    },
  },
};

const userPrompts: Record<string, (extra?: any) => string> = {
  workouts: () =>
    "Составь персональный недельный план тренировок (5-7 дней) с упражнениями, подходами и повторениями. Учитывай мой уровень подготовки, цель и место тренировки.",
  meals: () =>
    "Составь 7-дневный план питания. Для каждого дня дай 4-5 приёмов пищи с ингредиентами, калориями и макронутриентами (белки, жиры, углеводы). Учитывай мою цель, диету и ограничения.",
  supplements: () =>
    "Рекомендуй добавки (витамины, минералы, нутрицевтики) на основе моей цели, жалоб и типа диеты. Для каждой добавки укажи дозировку, время приёма, длительность курса и обоснование.",
  shopping: (extra) =>
    `Составь список покупок по категориям (белки, овощи, крупы, молочные, фрукты, другое) на основе этого плана питания:\n${JSON.stringify(extra?.mealPlan || "стандартный план")}`,
  sos: (extra) =>
    `Дай персонализированный протокол для ситуации: "${extra?.topic || "общее недомогание"}". Учитывай мой профиль, цель и ограничения. Дай конкретные шаги и рекомендации по добавкам если уместно.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { type, profile, extra } = await req.json();

    if (!type || !toolSchemas[type]) {
      return new Response(JSON.stringify({ error: `Invalid type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(profile || {});
    const userPrompt = userPrompts[type](extra);
    const tool = toolSchemas[type];

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: tool }],
        tool_choice: { type: "function", function: { name: tool.name } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI gateway error:", status, body);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Подождите немного и попробуйте снова." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Исчерпан лимит AI-запросов. Пополните баланс в настройках." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Ошибка AI-сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI не вернул структурированный ответ" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
