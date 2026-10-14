// Home page distributor enquiry form. Same fields, limits and replies as the old distributor.php.
import { field, isEmail, json, oneLine, readForm, sendMail } from "../lib/send.js";

export async function POST(request) {
  const form = await readForm(request);
  if (!form) return json(400, false, "Invalid form submission.");
  if (field(form, "website")) return json(200, true, "Thank you. Your enquiry has been sent."); // honeypot

  const name = field(form, "name");
  const contact = field(form, "contact");
  const message = field(form, "extra");
  if (!name || !contact) return json(422, false, "Please fill in your name and phone number.");
  if (name.length > 100 || contact.length > 150 || message.length > 3000) return json(422, false, "One or more fields are too long.");

  const cleanName = oneLine(name);
  const cleanContact = oneLine(contact);
  const sent = await sendMail({
    subject: `Distributor Enquiry from ${cleanName}`,
    text: `Name: ${cleanName}\nPhone: ${cleanContact}\n\n${message}\n`,
    replyTo: isEmail(cleanContact) ? cleanContact : undefined,
  });
  if (!sent) return json(500, false, "Unable to send right now. Please call us directly.");
  return json(200, true, "Thank you! We'll be in touch within 24 hours.");
}

export function GET() {
  return json(405, false, "Method not allowed.");
}
