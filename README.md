# A STUDIO

Single-file website deployed on Vercel. The contact form submits to `api/contact.js` and sends inquiries through Resend.

## Vercel environment variables

Set these in **Project Settings → Environment Variables**, then redeploy:

- `RESEND_API_KEY`: a Resend API key with sending permission.
- `RESEND_FROM_EMAIL`: a sender on a domain verified in Resend, formatted like `A STUDIO <hello@your-verified-domain.com>`.

Form notifications are sent to `astudio.design@proton.me`. The Resend API key stays on the server and is never included in the website HTML. For production delivery, verify a domain you control in Resend and use an address on that domain as the sender.