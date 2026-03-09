import { motion } from "framer-motion";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Доступ только для участников клуба
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Это приложение доступно только для подписчиков клуба «Возрождение». Чтобы пользоваться приложением, вступите в клуб.
          </p>
        </div>
        <a
          href="https://polinan.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Подробнее о клубе
        </a>
      </motion.div>
    </div>
  );
}
