"use client";

import { CheckCircle2, Lock, Truck, Undo2 } from "lucide-react";
import { motion } from "framer-motion";

const TRUST_ITEMS = [
  {
    icon: CheckCircle2,
    title: "Premium 240 GSM",
    description: "Heavyweight combed cotton, pre-shrunk, built to last.",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    description: "Ships everywhere in India. Tracked, 3–6 days.",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    description: "Razorpay UPI, cards & wallets. Encrypted end-to-end.",
  },
  {
    icon: Undo2,
    title: "Easy Returns",
    description: "7-day hassle-free returns on unworn tees.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-b border-ink/10 bg-bone py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4 sm:gap-8 lg:gap-12">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={title}
              className="group flex flex-col items-center text-center sm:items-start sm:text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            >
              <div className="mb-5 inline-flex rounded-2xl border border-ink/15 bg-white p-4 transition-colors duration-300 group-hover:border-ink">
                <Icon className="h-7 w-7 text-ink transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h4 className="mb-2 text-sm font-black uppercase tracking-widest text-ink md:text-base">
                {title}
              </h4>
              <p className="max-w-[24ch] text-xs leading-relaxed text-ink/55 md:text-sm">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
