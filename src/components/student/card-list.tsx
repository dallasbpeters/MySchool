'use client'

import type React from 'react'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { images } from '@/components/expanding-card'
import '../ui/shared-card-styles.css'
import { MotionButton } from '../ui/button'

interface Assignment {
  id: string
  title: string
  content?: string
  category?: string
  links?: Array<{ url: string; title: string }>
  completed?: boolean
  created_at?: string
  updated_at?: string
}

interface Recommendation {
  id: string
  title: string
  content?: string
  category?: string
  links?: Array<{ url: string; title: string }>
  created_at: string
  updated_at: string
  created_by: string
  parent_name?: string
}

interface CardProps {
  id: string
  imageIndex: number
  title: string
  category: string
  open: VoidFunction
  top?: number
  bottom?: number
  width?: string
  left?: number
  theme?: 'dark' | 'light'
}

interface Item {
  id: string
  category: string
  title: string
  imageIndex: number
  content: React.ReactNode
  top?: number
  bottom?: number
  width?: string
  left?: number
  theme?: 'dark' | 'light'
}

const getDateLabel = (assignment: Assignment) => {
  return assignment.created_at
    ? new Date(assignment.created_at).toLocaleDateString()
    : 'No date'
}

function Card({ id, title, category, open, imageIndex, theme }: CardProps) {
  return (
    <li className={`card ${theme}`} onClick={open}>
      <motion.div
        className="card-content"
        layoutId={`rec-card-container-${id}`}
      >
        <motion.div
          className="card-image-container"
          layoutId={`card-image-container-${id}`}
        >
          <motion.img
            className="card-image"
            src={images[imageIndex % images.length]}
            alt=""
            style={{ backgroundSize: '100%', backgroundPosition: 'top' }}
            layoutId={`card-image-${id}`}
          />
        </motion.div>
        <motion.div
          className="title-container"
          layoutId={`title-container-${id}`}
          layout="position"
        >
          <span className="category">{category}</span>
          <h2 className="font-bold text-xl h2">{title}</h2>
        </motion.div>
      </motion.div>
    </li>
  )
}

function List({ items, open }: { items: Item[]; open: (id: string) => void }) {
  return (
    <ul className="card-list">
      {items.map((card) => (
        <Card
          imageIndex={card.imageIndex}
          key={card.id}
          {...card}
          open={() => open(card.id)}
        />
      ))}
    </ul>
  )
}

function Item({
  id,
  items,
  close,
}: {
  id: string
  items: Item[]
  close: VoidFunction
}) {
  const { category, title, content, imageIndex, theme } = items.find(
    (item) => item.id === id,
  )!

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        style={{ pointerEvents: 'auto' }}
        className="card-overlay"
      />
      <div className={`card-content-container open ${theme}`}>
        <motion.div
          className="card-content"
          layoutId={`rec-card-container-${id}`}
        >
          <motion.button
            className="close-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              close()
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
          <motion.div
            className="card-image-container"
            layoutId={`card-image-container-${id}`}
          >
            <motion.img
              className="card-image"
              src={images[imageIndex % images.length]}
              alt=""
              style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
              layoutId={`card-image-${id}`}
            />
          </motion.div>
          <motion.div
            className="title-container"
            layoutId={`title-container-${id}`}
            layout="position"
          >
            <span className="category">{category}</span>
            <h2 className="font-bold text-xl h3">{title}</h2>
          </motion.div>
          <motion.div className="content-container small">{content}</motion.div>
        </motion.div>
      </div>
    </>
  )
}

function CardGroup({
  assignments,
  recommendations,
}: {
  assignments: Assignment[]
  recommendations?: Recommendation[]
}) {
  // Transform assignments and recommendations to items format
  const items: Item[] = transformDataToItems(assignments, recommendations)

  const [openId, open] = useState<string | null>(null)

  const close = () => open(null)

  return (
    <>
      <List items={items} open={(id: string) => open(id)} />
      <AnimatePresence>
        {openId && <Item close={close} id={openId} items={items} key="item" />}
      </AnimatePresence>
    </>
  )
}

export default function CardList({
  assignments,
  recommendations,
}: {
  assignments: Assignment[]
  recommendations?: Recommendation[]
}) {
  return (
    <div id="card-list">
      <CardGroup assignments={assignments} recommendations={recommendations} />
    </div>
  )
}

function transformDataToItems(
  assignments: Assignment[] = [],
  recommendations: Recommendation[] = [],
): Item[] {
  const assignmentItems = assignments.map((assignment, index) => ({
    id: `assignment-${assignment.id}`,
    category: assignment.category || 'Assignments',
    title: assignment.title,
    imageIndex: index % images.length,
    content: assignment.content ? (
      <div className="prose prose-sm max-w-none">
        <p className="big">{assignment.title}</p>
        <div dangerouslySetInnerHTML={{ __html: assignment.content }} />
        {assignment.links && assignment.links.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Resources:</h4>
            <ul className="space-y-1">
              {assignment.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <div className="prose prose-sm max-w-none">
        <p className="big">{assignment.title}</p>
        <p className="text-muted-foreground">{getDateLabel(assignment)}</p>
        {assignment.links && assignment.links.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Resources:</h4>
            <ul className="space-y-1">
              {assignment.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-secondary underline"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ),
    theme: assignment.completed ? ('light' as const) : ('dark' as const),
  }))

  const recommendationItems =
    recommendations?.map((recommendation, index) => ({
      id: `recommendation-${recommendation.id}`,
      category: recommendation.category || 'Recommendations',
      title: recommendation.title,
      imageIndex: (assignments.length + index) % images.length,
      content: (
        <div className="prose prose-sm max-w-none">
          {recommendation.content && (
            <div dangerouslySetInnerHTML={{ __html: recommendation.content }} />
          )}
          {recommendation.links && recommendation.links.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Resources:</h4>
              <ul className="space-y-1">
                {recommendation.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <MotionButton
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 ring-1 ring-primary"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      {link.title}
                    </MotionButton>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      theme: 'light' as const,
    })) || []

  return [...assignmentItems, ...recommendationItems]
}

