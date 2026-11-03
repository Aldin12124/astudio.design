const RECIPIENT = "astudio.design@proton.me";
const MAX_BODY_BYTES = 20000;

const cleanText = (value, maxLength) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const json = (res, status, payload) => res.status(status).json(payload);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(res, 413, { error: "The inquiry is too long." });
  }

  const origin = req.headers.origin;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
  if (origin && host) {
    try {
      if (new URL(origin).host.toLowerCase() !== host) {
        return json(res, 403, { error: "Request origin not allowed." });
      }
    } catch {
      return json(res, 403, { error: "Request origin not allowed." });
    }
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (cleanText(body.company_website, 200)) {
    return json(res, 200, { ok: true });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254);
  const business = cleanText(body.business, 160);
  const type = cleanText(body.type, 100);
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 5000) : "";
  const budget = cleanText(body.budget, 120);
  const projectPackage = cleanText(body.package, 40);

  if (!name || !email || !type || !description || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: "Please check the required fields and email address." });
  }
  if (description.length < 10) {
    return json(res, 400, { error: "Please add a little more detail about your project." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !sender) {
    return json(res, 503, { error: "The email service is not configured." });
  }

  const fields = [
    ["Name", name],
    ["Email", email],
    ["Business", business || "Not provided"],
    ["Website type", type],
    ["Budget", budget || "Not provided"],
    ["Package", projectPackage || "Not selected"],
    ["Project details", description],
  ];
  const html = `<h2>New A STUDIO project inquiry</h2><table>${fields.map(([label, value]) => `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`;
  const text = fields.map(([label, value]) => `${label}:\n${value}`).join("\n\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [RECIPIENT],
        reply_to: email,
        subject: `New website inquiry from ${name}`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      return json(res, 502, { error: "The inquiry could not be delivered. Please try again later." });
    }
    return json(res, 200, { ok: true });
  } catch {
    return json(res, 502, { error: "The inquiry could not be delivered. Please try again later." });
  }
};