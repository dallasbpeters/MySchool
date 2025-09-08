'use client'

import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Select from '@radix-ui/react-select'
import { motion } from 'motion/react'
import { useState } from 'react'

function RadixSelect() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <>
      <Select.Root
        open={open}
        onOpenChange={setOpen}
        value={value}
        onValueChange={setValue}
      >
        <Select.Trigger className="trigger" asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ willChange: 'transform' }}
          >
            <Select.Value placeholder="Select a fruit..." />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </motion.button>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content asChild>
            <motion.div
              className="content"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                scale: {
                  type: 'spring',
                  visualDuration: 0.3,
                  bounce: 0.5,
                },
              }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Select.Viewport className="viewport">
                {['Apple', 'Banana', 'Orange', 'Grape'].map((fruit) => (
                  <Select.Item
                    key={fruit}
                    value={fruit.toLowerCase()}
                    className="item"
                    asChild
                  >
                    <motion.div
                      initial={{
                        backgroundColor: '#0b1011',
                      }}
                      whileHover={{
                        backgroundColor: '#9911ff',
                      }}
                      transition={{
                        duration: 0.1,
                        ease: 'linear',
                      }}
                      style={{
                        willChange: 'background-color',
                      }}
                    >
                      <Select.ItemText>{fruit}</Select.ItemText>
                    </motion.div>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </motion.div>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <StyleSheet />
    </>
  )
}

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>{`
            .trigger {
                display: inline-flex;
                align-items: center;
                justify-content: space-between;
                border-radius: 5px;
                padding: 0 15px;
                font-size: 16px;
                line-height: 1;
                height: 35px;
                gap: 5px;
                width: 200px;
                background-color: #0b1011;
                color: #f5f5f5;
                border: 1px solid #1d2628;
            }

            .trigger:focus {
                box-shadow: 0 0 0 2px #0f1115;
            }

            .content {
                overflow: hidden;
                background-color: #0b1011;
                color: #f5f5f5;
                border: 1px solid #1d2628;
                border-radius: 5px;
            }

            .viewport {
                padding: 5px;
            }

            .item {
                font-size: 16px;
                line-height: 1;
                border-radius: 3px;
                display: flex;
                align-items: center;
                height: 25px;
                padding-right: 35px;
                padding-left: 25px;
                position: relative;
                user-select: none;
                cursor: pointer;
            }

            .item[data-disabled] {
                color: var(--gray-500);
                pointer-events: none;
            }

            .item[data-highlighted] {
                outline: none;
                background-color: #0f1115;
                color: #f5f5f5;
            }
        `}</style>
  )
}

export default RadixSelect
