import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

function hexEncode(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function validateTelegramInitData(initData: string, botToken: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const entries = Array.from(params.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), botToken);
  const computedHash = hexEncode(await hmacSha256(secretKey, dataCheckString));

  if (computedHash !== hash) return null;

  // Check auth_date is not too old (allow 1 hour)
  const authDate = parseInt(params.get("auth_date") || "0");
  if (Date.now() / 1000 - authDate > 3600) return null;

  const result: Record<string, string> = {};
  for (const [k, v] of entries) result[k] = v;
  result.hash = hash;
  return result;
}

// Check if user is a member of the Telegram channel/group via Bot API
async function checkTelegramMembership(botToken: string, chatId: string, userId: number): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${userId}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      console.error("getChatMember error:", data);
      return false;
    }

    const status = data.result?.status;
    // member, administrator, creator are valid; left, kicked, restricted (with is_member=false) are not
    return ["member", "administrator", "creator"].includes(status);
  } catch (err) {
    console.error("checkTelegramMembership fetch error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData) {
      return new Response(JSON.stringify({ error: "Missing initData" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validated = await validateTelegramInitData(initData, botToken);
    if (!validated) {
      return new Response(JSON.stringify({ error: "Invalid Telegram data" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userDataStr = validated["user"];
    if (!userDataStr) {
      return new Response(JSON.stringify({ error: "No user data in initData" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = JSON.parse(userDataStr);
    const telegramId = tgUser.id;
    const username = tgUser.username || "";
    const firstName = tgUser.first_name || "";

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingMember } = await supabaseAdmin
      .from("telegram_members")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    // --- Auto-check membership via Telegram Bot API ---
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    let isMemberInChannel = false;

    if (chatId) {
      isMemberInChannel = await checkTelegramMembership(botToken, chatId, telegramId);
      console.log(`Telegram membership check: user ${telegramId} in chat ${chatId} = ${isMemberInChannel}`);

      // Sync membership status to telegram_members table
      if (isMemberInChannel) {
        // Upsert as active member
        await supabaseAdmin.from("telegram_members").upsert(
          {
            telegram_id: telegramId,
            is_active: true,
            activated_at: new Date().toISOString(),
            deactivated_at: null,
            telegram_username: username || null,
            telegram_first_name: firstName || null,
          },
          { onConflict: "telegram_id" }
        );
      } else {
        // Preserve manually activated members from the admin panel even if
        // the Telegram membership check is unavailable or does not confirm access.
        if (existingMember?.is_active) {
          await supabaseAdmin
            .from("telegram_members")
            .update({
              telegram_username: username || existingMember.telegram_username || null,
              telegram_first_name: firstName || existingMember.telegram_first_name || null,
            })
            .eq("telegram_id", telegramId);
          console.log(`Telegram membership fallback: user ${telegramId} allowed by active DB record`);
        } else {
          console.log(`Telegram membership check denied access for user ${telegramId}`);
        }
      }
    }

    // Now check membership in DB (it was just synced above)
    const { data: member } = await supabaseAdmin
      .from("telegram_members")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (!member || !member.is_active) {
      return new Response(
        JSON.stringify({ error: "Доступ только для членов клуба", code: "NOT_MEMBER" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId = member.user_id;

    if (!userId) {
      // Create a new Supabase user for this Telegram user
      const email = `tg_${telegramId}@telegram.local`;
      const password = crypto.randomUUID() + crypto.randomUUID();

      // Check if user already exists with this email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === email);

      if (existing) {
        userId = existing.id;
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { telegram_id: telegramId, telegram_username: username, telegram_first_name: firstName },
        });
        if (createError) throw createError;
        userId = newUser.user.id;
      }

      // Link user_id to telegram_members
      await supabaseAdmin
        .from("telegram_members")
        .update({ user_id: userId, telegram_username: username, telegram_first_name: firstName })
        .eq("telegram_id", telegramId);
    } else {
      // Update username/first_name if changed
      await supabaseAdmin
        .from("telegram_members")
        .update({ telegram_username: username, telegram_first_name: firstName })
        .eq("telegram_id", telegramId);
    }

    // Generate session tokens
    const email = `tg_${telegramId}@telegram.local`;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) throw linkError;

    const accessToken = linkData.properties?.access_token;
    const refreshToken = linkData.properties?.refresh_token;

    if (!accessToken) {
      const hashedToken = linkData.properties?.hashed_token;
      
      const { data: sessionData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
        token_hash: hashedToken,
        type: "magiclink",
      });

      if (otpError) throw otpError;

      return new Response(
        JSON.stringify({
          access_token: sessionData.session?.access_token,
          refresh_token: sessionData.session?.refresh_token,
          user: sessionData.user,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("telegram-auth error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
