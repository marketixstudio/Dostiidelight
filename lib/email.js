/**
 * Branded HTML for the enquiry notification emails. Table layout with inline styles so it
 * renders the same in Gmail, Outlook and Apple Mail. Colours match css/styles.css.
 * The logo is a PNG (assets/email/logo.png) because Outlook does not show WebP.
 */
const SITE = "https://www.dostiidelight.com";
const C = {
  chili: "#9E1B1B",
  chiliDk: "#6E1212",
  saffron: "#F0A500",
  cream: "#FFF7EC",
  cream2: "#FBEFD9",
  leaf: "#4F7A3A",
  ink: "#2A1A12",
  inkSoft: "#5b463b",
  line: "#EADBC4",
};
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const digits = (v) => String(v ?? "").replace(/\D/g, "");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Indian numbers without a country code get +91 so call and WhatsApp links work. */
function phoneFor(contact) {
  const d = digits(contact);
  if (isEmail(contact) || d.length < 8 || d.length > 15) return null;
  return d.length === 10 ? `91${d}` : d;
}

function button(href, label, bg, fg = "#ffffff") {
  return `<td style="padding:0 8px 8px 0;"><a href="${href}" style="display:inline-block;background:${bg};color:${fg};font-family:${SANS};font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:13px 20px;border-radius:999px;">${label}</a></td>`;
}

function actions(contact, name, subject) {
  const out = [];
  const phone = phoneFor(contact);
  if (phone) {
    const hello = encodeURIComponent(`Hi ${name}, thank you for contacting Dostii Delight!`);
    out.push(button(`https://wa.me/${phone}?text=${hello}`, "WhatsApp", C.leaf));
    out.push(button(`tel:+${phone}`, "Call", C.chili));
  }
  if (isEmail(contact)) {
    out.push(button(`mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent(`Re: ${subject}`)}`, "Reply by email", C.chili));
  }
  return out.length ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;"><tr>${out.join("")}</tr></table>` : "";
}

function detailRows(rows) {
  return rows
    .map(
      ([label, value], i) => `<tr>
  <td style="padding:14px 16px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.inkSoft};width:110px;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:14px 16px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:16px;color:${C.ink};vertical-align:top;word-break:break-word;">${value}</td>
</tr>`,
    )
    .join("");
}

/**
 * @param {object} o
 * @param {string} o.badge    small label above the title, e.g. "Distributor enquiry"
 * @param {string} o.title    headline, e.g. "New enquiry from Riya"
 * @param {string} o.subject  email subject (used for the reply link)
 * @param {string} o.name
 * @param {string} o.contact  phone number or email address as typed
 * @param {string} [o.message]
 * @param {string} [o.messageLabel]
 * @param {string} o.source   which page the form was on
 */
export function enquiryEmail({ badge, title, subject, name, contact, message, messageLabel = "Message", source }) {
  const phone = phoneFor(contact);
  const contactHtml = phone
    ? `<a href="tel:+${phone}" style="color:${C.chili};text-decoration:none;font-weight:700;">${escapeHtml(contact)}</a>`
    : isEmail(contact)
      ? `<a href="mailto:${escapeHtml(contact)}" style="color:${C.chili};text-decoration:none;font-weight:700;">${escapeHtml(contact)}</a>`
      : escapeHtml(contact);
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const rows = [
    ["Name", `<strong>${escapeHtml(name)}</strong>`],
    ["Contact", contactHtml],
    ["Received", `${escapeHtml(when)} IST`],
    ["Form", escapeHtml(source)],
  ];
  const messageBlock = message
    ? `<tr><td style="padding:24px 32px 0;">
  <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.inkSoft};">${escapeHtml(messageLabel)}</p>
  <div style="background:${C.cream};border-left:4px solid ${C.saffron};border-radius:0 12px 12px 0;padding:16px 18px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.ink};white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</div>
</td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream2};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(`${name} · ${contact}${message ? ` · ${message.slice(0, 80)}` : ""}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream2};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(110,18,18,.12);">

<tr><td style="background:${C.chili};padding:22px 32px;" align="left">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td><a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/assets/email/logo.png" width="96" alt="Dostii Delight" style="display:block;border:0;width:96px;height:auto;background:#ffffff;border-radius:12px;padding:6px;"></a></td>
    <td align="right" style="font-family:${SERIF};font-size:15px;font-style:italic;color:${C.cream};">Pyaarisi Namkeen Dostii!</td>
  </tr></table>
</td></tr>
<tr><td style="height:5px;background:${C.saffron};line-height:5px;font-size:0;">&nbsp;</td></tr>

<tr><td style="padding:30px 32px 6px;">
  <span style="display:inline-block;background:${C.cream};color:${C.chili};font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${escapeHtml(badge)}</span>
  <h1 style="margin:14px 0 6px;font-family:${SERIF};font-size:28px;line-height:1.2;font-weight:600;color:${C.ink};">${escapeHtml(title)}</h1>
  <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.inkSoft};">Someone filled in the form on dostiidelight.com. Reply soon. The quickest options are below.</p>
</td></tr>

<tr><td style="padding:20px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:12px;border-collapse:separate;">${detailRows(rows)}</table>
</td></tr>
${messageBlock}
<tr><td style="padding:24px 32px 30px;">${actions(contact, name, subject)}</td></tr>

<tr><td style="background:${C.chiliDk};padding:22px 32px;" align="center">
  <p style="margin:0 0 6px;font-family:${SERIF};font-size:17px;color:#ffffff;">Dostii Delight</p>
  <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.cream2};">
    <a href="${SITE}" style="color:${C.cream2};text-decoration:none;">dostiidelight.com</a> &nbsp;·&nbsp;
    <a href="tel:+917378776612" style="color:${C.cream2};text-decoration:none;">+91 73787 76612</a> &nbsp;·&nbsp;
    <a href="https://instagram.com/dostiidelight" style="color:${C.cream2};text-decoration:none;">Instagram</a>
  </p>
  <p style="margin:10px 0 0;font-family:${SANS};font-size:11px;color:${C.saffron};">Sent automatically by the website contact form.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
