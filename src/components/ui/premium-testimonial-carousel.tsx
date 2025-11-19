import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Star, Verified, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from './avatar';
import { Card } from './card';
import { Button } from './button';

interface Testimonial {
  name: string;
  role: string;
  institution: string;
  content: string;
  avatar: string;
  rating: number;
  verified?: boolean;
}

interface PremiumTestimonialCarouselProps {
  testimonials: Testimonial[];
}

function TestimonialItem({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card className="glass dark:glass-dark p-8 relative overflow-hidden group hover:shadow-2xl transition-shadow duration-500">
        {/* Background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={false}
        />

        {/* Heartbeat pulse under avatar ring */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
        >
          <motion.div
            className="absolute left-8 top-8 w-16 h-16 rounded-full bg-teal-500/20 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6">
          {/* Avatar with heartbeat effect */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 blur-md"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              
              {/* Avatar */}
              <Avatar className="relative w-16 h-16 border-2 border-teal-500/50 shadow-lg">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                  {testimonial.avatar}
                </AvatarFallback>
              </Avatar>

              {/* Verified badge */}
              {testimonial.verified !== false && (
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-background flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <Verified className="w-3.5 h-3.5 text-white" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* Rating stars */}
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[...Array(testimonial.rating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3 + i * 0.05,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonial content */}
            <motion.p
              className="text-base leading-relaxed text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              "{testimonial.content}"
            </motion.p>

            {/* Author info with divider */}
            <motion.div
              className="pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{testimonial.name}</p>
                  <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {testimonial.institution}
                  </p>
                </div>

                {/* Verification badge text */}
                {testimonial.verified !== false && (
                  <motion.div
                    className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      Verified
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Neon highlight effect on hover */}
        <motion.div
          className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 pointer-events-none"
          initial={false}
        />
      </Card>
    </motion.div>
  );
}

export function PremiumTestimonialCarousel({ testimonials }: PremiumTestimonialCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, -50]);

  const visibleTestimonials = showAll ? testimonials : testimonials.slice(0, 3);
  const hasMore = testimonials.length > 3;

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, y }}
      className="w-full max-w-7xl mx-auto space-y-8"
    >
      <AnimatePresence mode="popLayout">
        {visibleTestimonials.map((testimonial, index) => (
          <TestimonialItem key={index} testimonial={testimonial} index={index} />
        ))}
      </AnimatePresence>

      {hasMore && (
        <motion.div 
          className="flex justify-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAll(!showAll)}
            className="group border-teal-500/30 hover:border-teal-500/60 hover:bg-teal-500/5 text-teal-600 dark:text-teal-400"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="ml-2 w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              </>
            ) : (
              <>
                View More Testimonials <ChevronDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
