import Link from 'next/link';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Information We Collect',
    body: (
      <>
        <p>We collect only the information needed to operate GenZee Video and keep your account secure:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Account information:</strong> your name, email address and profile picture when you sign up or
            sign in (including via Google).
          </li>
          <li>
            <strong>Content you submit:</strong> scripts and text you convert into AI voiceovers, content plans, post
            captions and media you choose to publish.
          </li>
          <li>
            <strong>Connected social accounts:</strong> when you connect Facebook Pages or Instagram Business
            accounts, we store the secure authorization needed to publish or schedule posts on your behalf.
          </li>
          <li>
            <strong>Payment and wallet information:</strong> credit top-ups are processed by our third-party payment
            partners. We never see or store your payment details, only the transaction status and credit balance.
          </li>
          <li>
            <strong>Usage and device data:</strong> anonymous analytics such as pages visited, feature usage, browser
            type and approximate region, used to improve performance and reliability.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '2. How We Use Your Information',
    body: (
      <ul className="list-disc pl-6 space-y-1">
        <li>To generate voiceovers and deliver the audio files you request.</li>
        <li>To publish and schedule posts to the social accounts you connect.</li>
        <li>To manage your credit wallet, process payments and prevent fraud.</li>
        <li>To provide customer support and respond to your enquiries.</li>
        <li>To maintain security, diagnose issues and improve our studio features.</li>
        <li>To send essential service notices such as receipts, security alerts and policy updates.</li>
      </ul>
    ),
  },
  {
    title: '3. Third-Party Services & Data Sharing',
    body: (
      <>
        <p>
          We do not sell, rent or trade your personal data. To deliver the service, your scripts may be securely
          processed by our trusted AI voice partners (such as ElevenLabs, Fish Audio and Google Gemini), and we use
          reputable providers for hosting, authentication, payments and social publishing. These partners only
          receive the data necessary to perform their function and are bound by their own privacy obligations.
        </p>
        <p>We may also disclose information if required by law or to protect the rights and safety of our users.</p>
      </>
    ),
  },
  {
    title: '4. Data Storage & Retention',
    body: (
      <p>
        Generated audio and drafts are stored so you can access your history and re-download your work. You can delete
        your content at any time from your dashboard. When you delete your account, we remove your personal data and
        stored content within a reasonable period, except where we must retain limited records for legal, tax or
        fraud-prevention purposes.
      </p>
    ),
  },
  {
    title: '5. Cookies & Analytics',
    body: (
      <p>
        We use essential cookies to keep you signed in and remember your preferences, and privacy-conscious analytics
        to understand how the studio is used. You can control or clear cookies through your browser settings;
        disabling essential cookies may affect sign-in and core features.
      </p>
    ),
  },
  {
    title: '6. Data Security',
    body: (
      <p>
        We use industry-standard safeguards including encrypted connections (HTTPS), restricted access to production
        systems and secure storage of authorization credentials. No online service can guarantee absolute security, but
        we continually review our practices to protect your information.
      </p>
    ),
  },
  {
    title: '7. Your Rights & Choices',
    body: (
      <>
        <p>Depending on your location, you have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access and receive a copy of the personal data we hold about you.</li>
          <li>Correct inaccurate information or update your profile.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Disconnect any Facebook, Instagram or other social account at any time.</li>
          <li>Opt out of non-essential communications.</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:info@azeemlab.com" className="text-[#c83a2a] hover:underline font-semibold">
            info@azeemlab.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "8. Children's Privacy",
    body: (
      <p>
        GenZee Video is not intended for children under 13 (or the minimum age required in your country). We do not
        knowingly collect personal information from children. If you believe a child has provided us data, please
        contact us and we will delete it promptly.
      </p>
    ),
  },
  {
    title: '9. International Users',
    body: (
      <p>
        Our service is accessible worldwide. By using GenZee, you understand that your information may be processed in
        countries other than your own, where our infrastructure and partners operate, under appropriate safeguards.
      </p>
    ),
  },
  {
    title: '10. Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we make material changes, we will update the date
        below and, where appropriate, notify you by email or within the app.
      </p>
    ),
  },
];

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
          Privacy Policy
        </h1>
        <p className="text-center text-sm text-slate-500">Last updated: October 2026</p>
        <p className="text-base text-slate-600 leading-relaxed">
          Your privacy matters to us. This Privacy Policy explains what information GenZee Video (genzee.video)
          collects, how we use and protect it, and the choices you have when using our AI voice generator, content
          planner and social publishing tools.
        </p>
      </header>

      {sections.map((s) => (
        <section key={s.title} className="space-y-2 text-base text-slate-600 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">{s.title}</h2>
          <div className="space-y-3">{s.body}</div>
        </section>
      ))}

      <section className="space-y-2 text-base text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">11. Contact Us</h2>
        <p>
          Questions about this policy? Reach us via our{' '}
          <Link href="/contact-us" className="text-[#c83a2a] hover:underline font-semibold">
            Contact page
          </Link>{' '}
          or email{' '}
          <a href="mailto:info@azeemlab.com" className="text-[#c83a2a] hover:underline font-semibold">
            info@azeemlab.com
          </a>
          . See also our{' '}
          <Link href="/terms-of-service" className="text-[#c83a2a] hover:underline font-semibold">
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </div>
  );
}