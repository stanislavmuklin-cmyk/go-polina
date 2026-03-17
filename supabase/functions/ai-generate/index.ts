import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://polza.ai/api/v1/chat/completions";

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
                    items: {
                      type: "array",
                      items: {
                        type: "string",
                        description: "Ингредиент с точным количеством, например 'Куриная грудка — 150 г' или 'Оливковое масло — 5 мл'",
                      },
                    },
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
  report: {
    name: "generate_report_analysis",
    description: "Анализ отчёта пользователя и персональная рекомендация",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Краткий итог по отчёту (2-3 предложения)" },
        recommendations: { type: "array", items: { type: "string" }, description: "Конкретные рекомендации (3-5 пунктов)" },
        encouragement: { type: "string", description: "Мотивационное сообщение" },
      },
      required: ["summary", "recommendations", "encouragement"],
      additionalProperties: false,
    },
  },
};

const userPrompts: Record<string, (extra?: any) => string> = {
  workouts: () =>
    `Составь персональный недельный план тренировок, строго соблюдая эту структуру недели:
- Понедельник (Пн): силовая или смешанная тренировка с упражнениями, подходами и повторениями.
- Вторник (Вт): кардио-тренировка или рекомендации по физической активности (бег, плавание, велосипед, ходьба и т.д.).
- Среда (Ср): силовая или смешанная тренировка с упражнениями, подходами и повторениями.
- Четверг (Чт): кардио-тренировка или рекомендации по физической активности.
- Пятница (Пт): силовая или смешанная тренировка с упражнениями, подходами и повторениями.
- Суббота (Сб): отдых или лёгкая физическая активность по желанию (прогулка, растяжка, йога).
- Воскресенье (Вс): полный отдых.

Учитывай мой уровень подготовки, цель и место тренировки. Подбирай упражнения, направленные на достижение цели (если цель — снижение веса, акцент на жиросжигание; если набор массы — на гипертрофию и т.д.).`,
  meals: (extra) => {
    if (extra?.regenerateSingle && extra?.dayContext && typeof extra?.mealIndex === "number") {
      const dayName = extra.dayContext.dayName || "Неизвестный день";
      const currentMeal = extra.currentMeal || extra.dayContext.meals?.[extra.mealIndex];
      const mealName = currentMeal?.meal || "Приём пищи";
      const mealTime = currentMeal?.time || "00:00";
      const existingItems = Array.isArray(currentMeal?.items) ? currentMeal.items.join(", ") : "";

      return `Обнови только ОДИН конкретный приём пищи в недельном меню.

День недели: ${dayName}
Тип приёма пищи, который нужно сохранить: ${mealName}
Время приёма пищи, которое нужно сохранить: ${mealTime}
Текущий вариант блюда: ${existingItems || "не указан"}

Требования:
- Верни результат строго в той же JSON-структуре tools.
- Верни только один день в массиве days и только один приём пищи в массиве meals.
- В поле dayName верни ${dayName}.
- В поле meal обязательно сохрани тот же тип приёма пищи: ${mealName}. Не заменяй его на "завтрак", если это не завтрак.
- В поле time обязательно сохрани время ${mealTime}.
- Новый вариант должен заметно отличаться от текущего блюда по основным ингредиентам и сочетаниям.
- Избегай однотипных и повторяющихся решений вроде одинаковых каш, яиц и творога везде.
- Учитывай цель, диету и ограничения пользователя.
- Каждый элемент в поле items должен содержать точное количество в граммах, миллилитрах или штуках.
- Сделай блюдо реалистичным, бытовым и разнообразным.`;
    }

    return "Составь 7-дневный план питания. Для каждого дня дай 4-5 приёмов пищи с ингредиентами, калориями и макронутриентами (белки, жиры, углеводы). Учитывай мою цель, диету и ограничения. ВАЖНО: каждый элемент в поле items должен содержать не просто название продукта, а точное количество в граммах, миллилитрах или штуках. Пиши в формате вроде: 'Овсяные хлопья — 60 г', 'Яйца — 2 шт', 'Творог 5% — 150 г', 'Оливковое масло — 5 мл'. Не пиши ингредиенты без количества. Делай меню разнообразным по дням и приёмам пищи: не повторяй одни и те же блюда, базовые сочетания и шаблоны без необходимости. Не своди меню к постоянным завтракам из каши, яиц или творога, если на то нет явной причины. ВАЖНО: в поле dayName указывай ТОЛЬКО день недели (Пн, Вт, Ср, Чт, Пт, Сб, Вс) без дополнений вроде 'день тренировки' или 'день отдыха'.";
  },
  supplements: () =>
    "Рекомендуй добавки (витамины, минералы, нутрицевтики) на основе моей цели, жалоб и типа диеты. Для каждой добавки укажи дозировку, время приёма, длительность курса и обоснование.",
  shopping: (extra) =>
    `Составь список покупок по категориям (белки, овощи, крупы, молочные, фрукты, другое) на основе этого плана питания:\n${JSON.stringify(extra?.mealPlan || "стандартный план")}`,
  sos: (extra) =>
    `Дай персонализированный протокол для ситуации: "${extra?.topic || "общее недомогание"}". Учитывай мой профиль, цель и ограничения. Дай конкретные шаги и рекомендации по добавкам если уместно.`,
  report: (extra) =>
    `Проанализируй мой отчёт за сегодня и дай краткую персональную рекомендацию.

Данные отчёта:
- Вес: ${extra?.weight ? extra.weight + " кг" : "не указан"}
- Тренировка выполнена: ${extra?.workoutDone ? "да" : "нет"}
- Уровень энергии: ${extra?.energy || "не указан"}/10
- Удовлетворённость питанием: ${extra?.nutritionScore || "не указана"}/10
- Обхват груди: ${extra?.chest ? extra.chest + " см" : "не указан"}
- Обхват талии: ${extra?.waist ? extra.waist + " см" : "не указан"}
- Обхват ягодиц: ${extra?.glutes ? extra.glutes + " см" : "не указан"}
- Обхват бедра: ${extra?.thigh ? extra.thigh + " см" : "не указан"}

Будь кратким и конкретным. Дай 3-5 практических рекомендаций.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const POLZA_AI_API_KEY = Deno.env.get("POLZA_AI_API_KEY");
    if (!POLZA_AI_API_KEY) throw new Error("POLZA_AI_API_KEY is not configured");
    const POLZA_AI_MODEL = Deno.env.get("POLZA_AI_MODEL") || "google/gemini-3.1-flash-lite-preview";

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
        Authorization: `Bearer ${POLZA_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: POLZA_AI_MODEL,
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
