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
    answer: 'DiscNest is the ultimate disc golf marketplace and bag builder. You can buy and sell used disc golf discs in our marketplace, build and manage your disc golf bag, browse a comprehensive catalog of discs, and connect with other players in the community.',
  },
  {
    question: 'How do I buy discs on DiscNest?',
    answer: 'Browse our marketplace to find discs for sale from other players. Use filters to search by brand, condition, or location. When you find a disc you like, message the seller directly through our built-in messaging system to arrange the purchase.',
  },
  {
    question: 'Can I sell my discs on DiscNest?',
    answer: 'Yes! Create a free account and list your discs for sale. Include photos, condition details, and your location. Buyers can find your listings and message you directly to make a purchase.',
  },
  {
    question: 'What is the disc golf bag builder?',
    answer: 'The disc golf bag builder helps you build and manage your disc golf collection. Organize discs between your shelf and active bag, track which discs you own, analyze your bag composition, and share your bag with friends. It\'s a complete inventory management system for your disc golf gear.',
  },
  {
    question: 'How do I find discs near me?',
    answer: 'Our marketplace includes a map view that shows listings based on location. When browsing, you can see discs available in your area and filter by proximity. This makes it easy to find local sellers and avoid shipping costs.',
  },
  {
    question: 'Is DiscNest free to use?',
    answer: 'Yes, DiscNest is free to use! You can create an account, browse the catalog, manage your bag, buy and sell discs, and connect with other players at no cost.',
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
