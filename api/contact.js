// Contact page enquiry form. Same fields, limits and replies as the old contact.php.
import { field, isEmail, json, oneLine, readForm, sendMail } from "../lib/send.js";

export async function POST(request) {
  const form = await readForm(request);
  if (!form) return json(400, false, "Invalid form submission.");
  if (field(form, "website")) return json(200, true, "Thank you. Your enquiry has been sent."); // honeypot

  const name = field(form, "name");
  const contact = field(form, "contact");
  const message = field(form, "message");
  if (!name || !contact || !message) return json(422, false, "Please complete all required fields.");
  if (name.length > 100 || contact.length > 150 || message.length > 3000) return json(422, false, "One or more fields are too long.");

  const cleanName = oneLine(name);
  const cleanContact = oneLine(contact);
  const sent = await sendMail({
    subject: `Website enquiry from ${cleanName}`,
    text: `Name: ${cleanName}\nContact: ${cleanContact}\n\nMessage:\n${message}\n`,
    replyTo: isEmail(cleanContact) ? cleanContact : undefined,
  });
  if (!sent) return json(500, false, "Unable to send right now. Please call or email us directly.");
  return json(200, true, "Thank you. Your enquiry has been sent.");
}

export function GET() {
  return json(405, false, "Method not allowed.");
}
