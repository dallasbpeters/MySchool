'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WysiwygEditorProps {
  content?: any
  onChange?: (content: any) => void
  placeholder?: string
  className?: string
}

export function WysiwygEditor({
  content,
  onChange,
  placeholder = 'Start typing your assignment...',
  className
}: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        multicolor: true
      }),
      TextStyle,
      Color
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
          'prose-headings:font-semibold prose-p:my-2',
          '[&_.ProseMirror-placeholder]:text-muted-foreground [&_.ProseMirror-placeholder]:opacity-50',
          className
        )
      }
    }
  })

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-muted')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('highlight') && 'bg-muted')}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border self-center" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('blockquote') && 'bg-muted')}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('h-8 w-8 p-0', editor.isActive('code') && 'bg-muted')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border self-center" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border self-center" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-muted')}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border self-center" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}