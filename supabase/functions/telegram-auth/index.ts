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

    // Check membership
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
    // Use signInWithPassword is not possible since we don't know the password.
    // Instead, generate a magic link and extract the token, or use admin.generateLink
    // The simplest approach: use admin.generateLink with type "magiclink"
    const email = `tg_${telegramId}@telegram.local`;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) throw linkError;

    // The generateLink returns properties with the session info
    const accessToken = linkData.properties?.access_token;
    const refreshToken = linkData.properties?.refresh_token;

    if (!accessToken) {
      // Fallback: if generateLink doesn't give tokens directly, we extract from hashed_token
      // Actually, generateLink returns the hashed_token which we can use to verify OTP
      const hashedToken = linkData.properties?.hashed_token;
      
      // Use verifyOtp with the token_hash
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
