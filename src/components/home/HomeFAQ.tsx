'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import StructuredData from '@/components/StructuredData';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'What is DiscNest?',
    answer: 'DiscNest is a set of tools for disc golfers. You can build and manage your disc golf bag, browse a catalog of discs with their flight numbers, and calculate your rating and handicap from the rounds you play.',
  },
  {
    question: 'What is the disc golf bag builder?',
    answer: 'The bag builder helps you manage your disc golf collection. Organize discs between your shelf and your active bag, track which discs you own, see how your bag breaks down by speed and stability, and share your setup with friends.',
  },
  {
    question: 'What is in the disc catalog?',
    answer: 'The catalog covers discs from every major brand, each with its speed, glide, turn, and fade. You can filter by flight numbers and type, which makes it easy to compare molds before you throw or buy.',
  },
  {
    question: 'How does the handicap calculator work?',
    answer: 'Enter your PDGA round ratings, your UDisc ratings, or plain scores. DiscNest turns them into a rating and a handicap in throws. Sign in and it saves your rounds and charts your progress over time. No account is needed to try it.',
  },
  {
    question: 'Do I need an account?',
    answer: 'You can browse the catalog and use the handicap calculator without an account. Creating a free account lets you save your bag, keep your rounds, and track your rating as it changes.',
  },
  {
    question: 'Is DiscNest free to use?',
    answer: 'Yes. Browsing the catalog, building your bag, and running the handicap calculator are all free.',
  },
];

export default function HomeFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // FAQ Structured Data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <StructuredData data={faqSchema} id="faq-schema" />
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 mb-12"
          >
            <h2 className="h2">Frequently Asked Questions</h2>
            <p className="text-lg text-muted">
              Everything you need to know about DiscNest
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="border border-muted/40 rounded-lg bg-surface overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--surface)]/80 transition-colors"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-heading font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4 text-muted"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
