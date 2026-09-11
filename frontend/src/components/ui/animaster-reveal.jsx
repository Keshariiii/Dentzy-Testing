'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * AnimasterReveal — Animaster Lib
 *
 * Staggered kinetic word/letter reveal powered by Framer Motion.
 * Each word fades in and slides upward with spring easing.
 *
 * @param {object}  props
 * @param {string}  props.text              – Text to animate (split by spaces)
 * @param {string}  [props.className]       – Additional class names for wrapper
 * @param {string}  [props.wordClassName]   – Class names for each word span
 * @param {'word'|'letter'} [props.splitBy='word'] – Animation granularity
 * @param {number}  [props.staggerDelay=0.08] – Delay between each element
 * @param {number}  [props.initialY=20]     – Starting Y offset in px
 * @param {boolean} [props.once=true]       – Animate only once when in view
 */
export function AnimasterReveal({
  text,
  className,
  wordClassName,
  splitBy = 'word',
  staggerDelay = 0.08,
  initialY = 20,
  once = true,
  ...props
}) {
  const elements = splitBy === 'letter' ? text.split('') : text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: initialY,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className={cn('inline-flex flex-wrap', className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      {...props}
    >
      {elements.map((element, index) => (
        <motion.span
          key={`${element}-${index}`}
          className={cn('inline-block', wordClassName)}
          variants={childVariants}
        >
          {element}
          {splitBy === 'word' && index < elements.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default AnimasterReveal;
