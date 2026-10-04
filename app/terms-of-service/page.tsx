import Link from 'next/link';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Acceptance of Terms',
    body: (
      <p>
        By accessing or using GenZee Video (genzee.video), you agree to be bound by these Terms of Service and our{' '}
        <Link href="/privacy-policy" className="text-[#c83a2a] hover:underline font-semibold">
          Privacy Policy
        </Link>
        . If you do not agree, please do not use the service. You must be at least 13 years old (or the minimum age in
        your country) to create an account.
      </p>
    ),
  },
  {
    title: '2. The Service',
    body: (
      <p>
        GenZee is an AI content studio that provides text-to-speech voiceover generation using premium voice models,
        AI content planning tools, and direct Facebook, Instagram and YouTube publishing and scheduling workflows. We
        may add, change or retire features over time to improve the studio.
      </p>
    ),
  },
  {
    title: '3. Accounts & Security',
    body: (
      <p>
        You are responsible for keeping your login credentials secure and for all activity under your account. Notify
        us immediately of any unauthorized use. You must provide accurate information and may not share or resell
        access to your account.
      </p>
    ),
  },
  {
    title: '4. Credits, Payments & Refunds',
    body: (
      <>
        <p>
          GenZee uses a Pay-As-You-Go credit wallet, so there is no forced subscription. You top up credits and spend
          them when you generate voiceovers or use paid features.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Credit cost depends on the voice model and the length of the content generated.</li>
          <li>Payments are processed securely by third-party payment providers.</li>
          <li>Credits are non-transferable and have no cash value outside the service.</li>
          <li>
            Credits consumed by a completed generation are non-refundable. If a generation fails because of a
            technical error on our side, the credits are returned to your wallet.
          </li>
          <li>Prices and credit rates may change; changes never affect credits you have already purchased.</li>
        </ul>
      </>
    ),
  },
  {
    title: '5. Acceptable Use',
    body: (
      <>
        <p>You agree not to use GenZee to create, upload or publish content that:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>is unlawful, hateful, harassing, defamatory, sexually exploitative or violent;</li>
          <li>impersonates a real person or clones a voice without their explicit consent;</li>
          <li>spreads misinformation, scams, spam or deceptive political content;</li>
          <li>infringes copyrights, trademarks or other rights of third parties;</li>
          <li>violates the policies of Facebook, Instagram, YouTube or any connected platform.</li>
        </ul>
        <p>
          You also agree not to abuse, reverse-engineer, scrape or overload the service. We may suspend or terminate
          accounts that violate these rules.
        </p>
      </>
    ),
  },
  {
    title: '6. Your Content & Commercial Use',
    body: (
      <p>
        You retain ownership of the text and media you submit. Subject to these Terms and the licensing of the
        underlying voice providers, you may use audio generated through paid credits in commercial projects, including
        monetized YouTube videos, podcasts, ads and social media content. You are solely responsible for ensuring your
        content is lawful and that you hold the rights to everything you submit.
      </p>
    ),
  },
  {
    title: '7. Social Media Connections',
    body: (
      <p>
        When you connect a Facebook Page or Instagram Business account, you authorize GenZee to publish or schedule
        content you create on your behalf. You can disconnect at any time. Publishing remains subject to each
        platform&apos;s own rules, and we are not responsible for actions taken by those platforms, including content
        removal or account restrictions.
      </p>
    ),
  },
  {
    title: '8. Intellectual Property',
    body: (
      <p>
        The GenZee name, logo, interface, software and the underlying voice models remain the property of GenZee and
        its technology partners. Nothing in these Terms transfers ownership of our platform to you.
      </p>
    ),
  },
  {
    title: '9. Service Availability & Disclaimer',
    body: (
      <p>
        We work hard to keep GenZee reliable, but the service is provided &quot;as is&quot; and &quot;as
        available&quot; without warranties of any kind. We do not guarantee uninterrupted operation, specific
        pronunciation accuracy or that third-party platforms will always accept scheduled posts.
      </p>
    ),
  },
  {
    title: '10. Limitation of Liability',
    body: (
      <p>
        To the maximum extent permitted by law, GenZee and its partners are not liable for indirect, incidental or
        consequential damages, including lost profits, lost data or loss of audience, arising from your use of the
        service. Our total liability for any claim is limited to the amount you paid for credits in the three months
        before the claim.
      </p>
    ),
  },
  {
    title: '11. Termination',
    body: (
      <p>
        You may stop using GenZee and delete your account at any time. We may suspend or terminate access if you
        breach these Terms or if required by law. Unused credits may be forfeited upon termination for violations.
      </p>
    ),
  },
  {
    title: '12. Changes to These Terms',
    body: (
      <p>
        We may update these Terms from time to time. Continued use of the service after changes take effect means you
        accept the revised Terms. Material changes will be announced by email or in the app.
      </p>
    ),
  },
];

export default function TermsOfServiceContent() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-center">
          Terms of Service
        </h1>
        <p className="text-center text-sm text-slate-500">Last updated: October 2026</p>
        <p className="text-base text-slate-600 leading-relaxed">
          Welcome to GenZee Video (genzee.video). These Terms explain the rules for using our AI voice generator,
          content planner and social publishing studio. Please read them carefully.
        </p>
      </header>

      {sections.map((s) => (
        <section key={s.title} className="space-y-2 text-base text-slate-600 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">{s.title}</h2>
          <div className="space-y-3">{s.body}</div>
        </section>
      ))}

      <section className="space-y-2 text-base text-slate-600 leading-relaxed">
        <h2 className="text-xl font-bold text-slate-900">13. Contact</h2>
        <p>
          Questions about these Terms? Email{' '}
          <a href="mailto:info@azeemlab.com" className="text-[#c83a2a] hover:underline font-semibold">
            info@azeemlab.com
          </a>{' '}
          or visit our{' '}
          <Link href="/contact-us" className="text-[#c83a2a] hover:underline font-semibold">
            Contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}