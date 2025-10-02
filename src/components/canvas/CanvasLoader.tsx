'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function CanvasLoader() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#DDEEF9]">
      {/* Simple pulsing circle - darker */}
      <motion.div
        className="absolute h-32 w-32 rounded-full border border-[#5B98D6]/50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main graphic - no shadow */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Image
          src="/atlas-graphic-3.svg"
          alt="Loading"
          width={80}
          height={80}
          priority
        />
      </motion.div>

      {/* Rotating ring - darker and no shadow */}
      <motion.div
        className="absolute h-28 w-28"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.6,
          rotate: 360,
        }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.3 },
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#5B98D6"
            strokeWidth="1"
            strokeDasharray="6 3"
            opacity="0.7"
          />
        </svg>
      </motion.div>
    </div>
  );
}

