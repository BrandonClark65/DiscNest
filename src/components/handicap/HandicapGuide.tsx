import Link from 'next/link';

/**
 * Server component on purpose.
 *
 * This is the page's SEO payload. Keeping it out of the client component
 * guarantees it lands in the server-rendered HTML and can never end up behind
 * a `useSession()` branch, which would hide it from crawlers entirely.
 */

export const HANDICAP_FAQ: { question: string; answer: string }[] = [
  {
    question: 'How do you calculate a disc golf handicap?',
    answer:
      'A disc golf handicap converts your scores into a rating, then converts that rating into the number of throws you should receive. Each round is rated with the PDGA formula: 1000 + (course SSA − your score) × points per throw, where SSA is the score a 1000-rated player would be expected to shoot. Your overall rating is the average of your best 8 round ratings from your last 20 rounds. Your handicap in throws is then (target rating − your rating) ÷ points per throw.',
  },
  {
    question: 'What is a good disc golf handicap?',
    answer:
      'On the 1000-point scale, recreational players typically sit between 700 and 850, intermediate players between 850 and 925, advanced players between 925 and 975, and touring professionals above 1000. Expressed as throws against a scratch (1000) target, a recreational player receives about 15 or more throws, an intermediate player 8 to 15, an advanced player 3 to 8, and a professional receives none - a player rated above 1000 gives throws back instead.',
  },
  {
    question: 'How many rounds do I need before my handicap is accurate?',
    answer:
      'We show a provisional number at 3 rounds and consider your rating established at 8. Below 3 rounds we show nothing at all, because one or two rounds measure luck more than skill. This mirrors the World Handicap System, which requires 54 holes to establish an index and applies a penalty adjustment to very small samples.',
  },
  {
    question: 'Can I use my UDisc rating instead of a PDGA rating?',
    answer:
      'Yes. UDisc round ratings use a separate 1–300 scale and UDisc does not publish an official conversion to the PDGA 1000 scale, so we convert with a community-derived formula and mark those rounds as estimated. If you have PDGA round ratings, use those instead - they are exact.',
  },
  {
    question: 'Is a DiscNest Rating the same as a PDGA rating?',
    answer:
      'No. It uses the same 1000-point scale so it reads the same way, but it is calculated from the rounds you enter here rather than from sanctioned tournament play. Because the mix of rounds differs, your DiscNest Rating will not match your official PDGA rating exactly. It is designed to be useful for league play and personal progress tracking, not to replace an official rating.',
  },
  {
    question: 'Why use the best 8 of 20 rounds instead of an average?',
    answer:
      'A plain average of self-reported scores is easy to inflate: post a few bad rounds and your handicap rises. Taking the best 8 of your last 20 is structurally resistant, because adding a bad round can only displace an older, worse one. The USGA World Handicap System uses this method for the same reason, and UDisc independently chose it for their player ratings.',
  },
  {
    question: 'Do I need a course rating to use the calculator?',
    answer:
      'No. If you know the layout SSA or course rating you will get the most accurate result, but you can also enter a PDGA or UDisc round rating, which already accounts for course difficulty. As a last resort you can enter your score against par, though par is a weak difficulty signal in disc golf since many courses list a flat 54.',
  },
  {
    question: 'Is the disc golf handicap calculator free?',
    answer:
      'Yes, completely free. You can calculate a handicap without an account. Creating a free DiscNest account additionally saves your rounds, recalculates your handicap automatically, and charts your progress over time.',
  },
];

export default function HandicapGuide() {
  return (
    <article className="prose-none mt-12 space-y-8 text-[var(--foreground)]/85 leading-relaxed">
      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          What is a disc golf handicap?
        </h2>
        <p>
          A handicap is a number of throws that levels the field between players of
          different skill. Give a newer player their handicap in throws and they can play
          a genuinely competitive match against someone who averages ten throws better.
          It is the mechanism that lets a weekly league run one division instead of five,
          and it is why handicapped events tend to hold onto beginners.
        </p>
        <p className="mt-3">
          Disc golf has no governing body issuing handicaps the way golf does. The PDGA
          issues <em>ratings</em>, and most leagues convert those ratings into throws
          themselves. That conversion is what this calculator automates - and it works
          whether or not you have a PDGA number.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          How the calculation works
        </h2>
        <p>
          Every round gets a rating on the familiar 1000-point scale using the PDGA&apos;s
          published formula:
        </p>
        <pre className="my-3 overflow-x-auto rounded-lg bg-[var(--muted)]/15 p-4 text-sm">
          <code>round rating = 1000 + (SSA − your score) × points per throw</code>
        </pre>
        <h3 className="font-heading text-lg font-semibold text-[var(--foreground)] mt-5 mb-2">
          SSA: the scratch scoring average
        </h3>
        <p>
          SSA is the score a 1000-rated player would be expected to shoot on that layout,
          on that day. It is the disc golf equivalent of golf&apos;s Course Rating. If a
          layout has an SSA of 50 and you shoot 50, you played a 1000-rated round. Shoot
          60 and you are ten throws worse, which is roughly a 900-rated round.
        </p>
        <h3 className="font-heading text-lg font-semibold text-[var(--foreground)] mt-5 mb-2">
          Points per throw: why one throw is worth more on an easy course
        </h3>
        <p>
          On a short, open course everyone&apos;s scores bunch together, so a single throw
          represents a bigger difference in skill - around 13 rating points. On a long,
          punishing course scores spread out and a throw is worth closer to 6 points. A
          typical 18-hole layout sits near 10 points per throw. This is disc golf&apos;s
          version of golf&apos;s Slope Rating, and it is why you cannot fairly compare a
          raw score of +10 on two different courses.
        </p>
        <h3 className="font-heading text-lg font-semibold text-[var(--foreground)] mt-5 mb-2">
          From rating to throws
        </h3>
        <p>
          Once you have a rating, your handicap is simply how far you are from the
          target, expressed in throws:
        </p>
        <pre className="my-3 overflow-x-auto rounded-lg bg-[var(--muted)]/15 p-4 text-sm">
          <code>handicap = (target rating − your rating) ÷ points per throw</code>
        </pre>
        <p>
          Most leagues set the target at 1000 (scratch), but you can set it to whatever
          your group plays to.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          Why we use your best 8 of 20 rounds
        </h2>
        <p>
          The PDGA computes a player rating as a weighted average of recent rounds. That
          works well for them because PDGA ratings come only from sanctioned tournaments,
          where nobody wants a reputation for tanking rounds. A site where you type in
          your own scores has no such safeguard, and with a plain average, posting bad
          rounds quietly raises your handicap.
        </p>
        <p className="mt-3">
          So we borrow the selection method from golf&apos;s World Handicap System
          instead: the average of your best 8 round ratings from your most recent 20. It
          measures what you are capable of rather than what you average, and adding a bad
          round can never help you - it can only push out an older, worse one. UDisc
          arrived at the same design for their player ratings.
        </p>
        <p className="mt-3">
          Two further safeguards come along with it. A soft and hard cap limits how fast
          your rating can fall relative to your best mark in the past year, and an
          exceptional-round adjustment bumps your whole record when you post a round far
          above your standing rating.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          Where to find your round ratings
        </h2>
        <h3 className="font-heading text-lg font-semibold text-[var(--foreground)] mt-4 mb-2">
          PDGA
        </h3>
        <p>
          Go to{' '}
          <a
            href="https://www.pdga.com/players"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline"
          >
            pdga.com
          </a>
          , search your name or PDGA number, and open your player page. Each event lists
          your per-round ratings. These are the most accurate input you can give us,
          because the PDGA has already done the course-difficulty work.
        </p>
        <h3 className="font-heading text-lg font-semibold text-[var(--foreground)] mt-4 mb-2">
          UDisc
        </h3>
        <p>
          UDisc Pro shows a round rating on scored rounds played on a Smart Layout with a
          difficulty classification. Those ratings use a 1–300 scale rather than the
          1000-point scale, and UDisc deliberately does not publish a conversion between
          the two. We convert them with a community-derived formula and flag the result
          as an estimate, so you know which of your numbers are exact and which are not.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          What counts as a good handicap
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-left border-b border-[var(--muted)]/30">
                <th className="py-2 pr-4 font-medium">Skill level</th>
                <th className="py-2 pr-4 font-medium">Rating</th>
                <th className="py-2 font-medium">Throws received vs scratch</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--muted)]/15">
                <td className="py-2 pr-4">Recreational</td>
                <td className="py-2 pr-4">700–850</td>
                <td className="py-2">15 or more</td>
              </tr>
              <tr className="border-b border-[var(--muted)]/15">
                <td className="py-2 pr-4">Intermediate</td>
                <td className="py-2 pr-4">850–925</td>
                <td className="py-2">8 to 15</td>
              </tr>
              <tr className="border-b border-[var(--muted)]/15">
                <td className="py-2 pr-4">Advanced</td>
                <td className="py-2 pr-4">925–975</td>
                <td className="py-2">3 to 8</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Professional</td>
                <td className="py-2 pr-4">1000+</td>
                <td className="py-2">None - gives throws back</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-[var(--foreground)]/70">
          Note that we don&apos;t use golf&apos;s plus-handicap notation. In golf a
          &ldquo;+2&rdquo; handicap means a player <em>better</em> than scratch, which
          trips up most disc golfers. We just say whether you receive throws or give
          them back.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-4">
          Frequently asked questions
        </h2>
        <dl className="space-y-5">
          {HANDICAP_FAQ.map((item) => (
            <div key={item.question}>
              <dt className="font-heading font-semibold text-[var(--foreground)]">
                {item.question}
              </dt>
              <dd className="mt-1">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-[var(--muted)]/30 pt-6">
        <h2 className="font-heading text-2xl font-semibold text-[var(--foreground)] mb-3">
          More on DiscNest
        </h2>
        <p>
          Tracking your handicap pairs well with tracking your gear. Build and organise
          your bag in the{' '}
          <Link href="/gear" className="text-[var(--primary)] underline">
            disc golf bag builder
          </Link>
          , browse flight numbers in the{' '}
          <Link href="/catalog" className="text-[var(--primary)] underline">
            disc catalog
          </Link>
          , or find discs near you in the{' '}
          <Link href="/marketplace" className="text-[var(--primary)] underline">
            marketplace
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
