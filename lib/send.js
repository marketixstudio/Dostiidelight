/**
 * Shared helpers for the two enquiry forms (replacing Hostinger's contact.php and
 * distributor.php). Mail goes out through Resend's API, so the site needs:
 *   RESEND_API_KEY   a Resend key with sending access
 *   FORM_FROM        e.g. "Dostii Delight Website <website@marketixstudio.com>"
 *                    (any sender on a domain verified in that Resend account)
 *   FORM_TO          optional, defaults to dostiidelight@gmail.com
 */
export const json = (status, ok, message) =>
  new Response(JSON.stringify({ ok, message }), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });

export const oneLine = (v) => String(v ?? "").trim().replace(/[\r\n]+/g, " ");
export const field = (form, key) => String(form.get(key) ?? "").trim();
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function readForm(request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

export async function sendMail({ subject, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FORM_FROM;
  if (!key || !from) {
    console.error("Form mail is not configured: set RESEND_API_KEY and FORM_FROM");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [process.env.FORM_TO || "dostiidelight@gmail.com"],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text());
  return res.ok;
}
