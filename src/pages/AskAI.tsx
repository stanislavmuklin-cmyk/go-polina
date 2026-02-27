import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { MessageCircle, Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "Что мне съесть на перекус?",
  "Какую тренировку делать сегодня?",
  "Как улучшить сон?",
  "Мне не хватает энергии",
];

export default function AskAI() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Привет! Я ваш AI-консультант по здоровью и wellness. Задайте вопрос о питании, тренировках, добавках или самочувствии. Я здесь, чтобы помочь 🌿" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: "Отличный вопрос! Для подробного ответа подключите AI-движок через Lovable Cloud. Сейчас я работаю в демо-режиме, но уже могу показать структуру ответа.\n\n📋 Рекомендация будет включать:\n• Научное обоснование\n• Практические шаги\n• Персонализацию под ваш профиль",
      };
      setMessages((prev) => [...prev, { role: "assistant", content: responses.default }]);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Спросить AI</h1>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground shadow-soft rounded-bl-md"
              }`}>
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
              >{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Задайте вопрос..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={() => sendMessage(input)}
            className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
