"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Landmark } from "lucide-react";
import { Button, Heading } from "./sk-ui";

export function EraSection({
  title,
  period,
  index,
  overview,
  children,
}: {
  title: string;
  period: string;
  index: number;
  overview: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="sk-era-section">
      <Button className="sk-era-banner" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="sk-era-banner-icon">
          <Landmark size={23} />
        </span>
        <span>
          <small>
            THỜI KỲ 0{index + 1} <i /> {period}
          </small>
          <Heading>{title}</Heading>
          <p>{overview}</p>
        </span>
        <ChevronDown className={open ? "" : "sk-rotate"} size={20} />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="sk-era-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
