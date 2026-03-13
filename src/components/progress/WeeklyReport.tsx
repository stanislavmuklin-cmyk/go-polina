import { Ruler, ClipboardCheck, Loader2, Calendar, Camera, X } from "lucide-react";
import { useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { generateContent } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function WeeklyReport() {
  const { profile, updateProfile, addXP } = useUser();
  const { user } = useAuth();

  const lastDate = profile.lastWeeklyReportDate ? parseISO(profile.lastWeeklyReportDate) : null;
  const nextDate = lastDate ? addDays(lastDate, 7) : null;
  const today = new Date();
  const daysLeft = nextDate ? differenceInDays(nextDate, today) : 0;
  const canSubmit = !lastDate || daysLeft <= 0;

  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [glutes, setGlutes] = useState("");
  const [thigh, setThigh] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ summary: string; recommendations: string[]; encouragement: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Photo upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - selectedFiles.length;
    const newFiles = files.slice(0, remaining);
    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...urls]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (reportDate: string): Promise<void> => {
    if (!user || selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${reportDate}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(path);

      await supabase.from("progress_photos").insert({
        user_id: user.id,
        report_date: reportDate,
        photo_url: urlData.publicUrl,
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setAiError(null);
    setAiResponse(null);
    try {
      const reportData = {
        weight: weight ? parseFloat(weight) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        glutes: glutes ? parseFloat(glutes) : null,
        thigh: thigh ? parseFloat(thigh) : null,
      };
      const result = await generateContent("report", profile, reportData);
      setAiResponse(result);

      const reportDate = format(today, "yyyy-MM-dd");

      // Upload photos
      await uploadPhotos(reportDate);

      // Save measurement to history
      const newEntry = {
        date: reportDate,
        weight: reportData.weight,
        chest: reportData.chest,
        waist: reportData.waist,
        glutes: reportData.glutes,
        thigh: reportData.thigh,
      };
      const updatedReports = [...(profile.weeklyReports || []), newEntry];

      updateProfile({
        lastWeeklyReportDate: reportDate,
        weeklyReports: updatedReports,
      });
      addXP(20);

      // Clear photo state
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err: any) {
      setAiError(err.message || "Ошибка анализа");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border p-5 shadow-soft space-y-5"
      >
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Еженедельный отчёт
        </h3>

        {/* Date info */}
        <div className="bg-muted rounded-lg p-3">
          {!lastDate ? (
            <p className="text-sm text-foreground font-medium">📋 Сдайте первый еженедельный отчёт!</p>
          ) : canSubmit ? (
            <p className="text-sm text-foreground font-medium">📋 Сдайте еженедельный отчёт!</p>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">
                Последний отчёт: {format(lastDate, "d MMMM", { locale: ru })}
              </p>
              <p className="text-sm text-foreground font-medium mt-1">
                Следующий отчёт: {format(nextDate!, "d MMMM", { locale: ru })} (через {daysLeft} дн.)
              </p>
            </div>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Вес (кг)</label>
          <input type="number" step="0.1" placeholder={`${profile.weight}`} value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Body measurements */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
            <Ruler className="w-4 h-4" /> Объёмы тела (см)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Грудь", value: chest, setter: setChest },
              { label: "Талия", value: waist, setter: setWaist },
              { label: "Ягодицы", value: glutes, setter: setGlutes },
              { label: "Бедро", value: thigh, setter: setThigh },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input type="number" step="0.1" placeholder="—" value={value} onChange={e => setter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
            <Camera className="w-4 h-4" /> Загрузить фото (до 3)
          </label>

          {/* Thumbnails */}
          {previewUrls.length > 0 && (
            <div className="flex gap-2 mb-3">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {selectedFiles.length === 0 ? "Выбрать фото" : "Добавить ещё"}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Анализирую...</>
          ) : !canSubmit ? (
            <>Доступен через {daysLeft} дн.</>
          ) : (
            <><ClipboardCheck className="w-4 h-4" /> Сдать еженедельный отчёт (+20 баллов)</>
          )}
        </button>
      </motion.div>

      {/* AI Response */}
      {aiResponse && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="gradient-accent rounded-xl p-5 border border-border/50 space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            🤖 Анализ AI
          </h3>
          <p className="text-sm text-foreground">{aiResponse.summary}</p>
          <ul className="space-y-1.5">
            {aiResponse.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-primary font-medium mt-2">{aiResponse.encouragement}</p>
        </motion.div>
      )}

      {aiError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-destructive/10 rounded-xl p-4 border border-destructive/20"
        >
          <p className="text-sm text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" /> {aiError}
          </p>
        </motion.div>
      )}
    </>
  );
}
