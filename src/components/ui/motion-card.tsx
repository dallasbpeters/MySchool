'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardMedia,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from './card'

export const MotionCard = motion.create(Card)
export const MotionCardMedia = motion.create(CardMedia)
export const MotionCardHeader = motion.create(CardHeader)
export const MotionCardFooter = motion.create(CardFooter)
export const MotionCardTitle = motion.create(CardTitle)
export const MotionCardAction = motion.create(CardAction)
export const MotionCardDescription = motion.create(CardDescription)
export const MotionCardContent = motion.create(CardContent)