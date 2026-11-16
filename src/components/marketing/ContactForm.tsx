"use client";

import { useState, type FormEvent } from "react";

type Phase = "editing" | "sending" | "sent" | "failed";

const fieldClass =
  "rounded-md border border-[#dcd5c7] bg-white px-3 text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]";
const labelClass = "text-xs font-black uppercase tracking-wide text-[#8c5d14]";

/**
 * The contact page's note form. The note is saved with the site's leads, so
 * the team reads it under Leads even when the email notification is off.
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [phase, setPhase] = useState<Phase>("editing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("sending");
    let received = false;
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, source: "contact" }),
      });
      const result = (await response.json().catch(() => null)) as { received?: boolean } | null;
      received = response.ok && result?.received === true;
    } catch {
      received = false;
    }
    setPhase(received ? "sent" : "failed");
  }

  if (phase === "sent") {
    return (
      <p
        role="status"
        data-testid="contact-sent"
        className="mt-5 rounded-md border border-[#bfe3d0] bg-[#e7f5ee] p-4 text-sm font-semibold leading-6 text-[#085041]"
      >
        Your note has reached us. We reply to {email} within one working day.
      </p>
    );
  }

  return (
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={send} data-testid="contact-form">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-name" className={labelClass}>Name</label>
        <input
          id="contact-name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`h-11 ${fieldClass}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className={labelClass}>Email</label>
        <input
          id="contact-email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-11 ${fieldClass}`}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="contact-message" className={labelClass}>Message</label>
        <textarea
          id="contact-message"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          placeholder="How can we help?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`py-3 ${fieldClass}`}
        />
      </div>
      {phase === "failed" ? (
        <p role="alert" className="text-sm font-semibold leading-6 text-[#9a2c1f] sm:col-span-2">
          We could not send your note just now. Please try again, or email us at{" "}
          <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={phase === "sending"}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-6 text-sm font-black text-white transition hover:bg-[#10291d] disabled:opacity-60"
        >
          {phase === "sending" ? "Sending…" : "Send note"}
        </button>
      </div>
    </form>
  );
}
