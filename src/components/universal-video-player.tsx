'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play, Video, ExternalLink } from 'lucide-react'

interface VideoPlayerProps {
  url: string
  title: string
  children?: React.ReactNode
}

// Helper functions for different video platforms
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

const getVimeoVideoId = (url: string): string | null => {
  const regex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' | 'unsupported' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  } else if (url.includes('vimeo.com')) {
    return 'vimeo'
  } else if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i)) {
    return 'direct'
  }
  return 'unsupported'
}

const getEmbedUrl = (url: string, videoType: string, videoId: string | null): string | null => {
  switch (videoType) {
    case 'youtube':
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : null
    case 'vimeo':
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null
    case 'direct':
      return url
    default:
      return null
  }
}

export function UniversalVideoPlayer({ url, title, children }: VideoPlayerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const videoType = getVideoType(url)
  const videoId = videoType === 'youtube' ? getYouTubeVideoId(url) :
    videoType === 'vimeo' ? getVimeoVideoId(url) : null
  const embedUrl = getEmbedUrl(url, videoType, videoId)

  // If unsupported video type, show external link
  if (videoType === 'unsupported' || !embedUrl) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          window.open(url, '_blank')
        }}
        className="cursor-pointer hover:text-primary/80 gap-2"
      >
        <ExternalLink className="h-3 w-3" />
        {title}
      </Button>
    )
  }

  // Default trigger if no children provided
  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="cursor-pointer hover:text-primary/80 gap-2"
    >
      <Play className="h-3 w-3 text-foreground-muted" />
      {title}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent aria-describedby={`dialog-description-${title}`} className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video">
          {videoType === 'direct' ? (
            <video
              controls
              autoPlay
              className="w-full h-full rounded-lg border"
              preload="metadata"
            >
              <source src={embedUrl} type="video/mp4" />
              <source src={embedUrl} type="video/webm" />
              <source src={embedUrl} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full rounded-lg border"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          <span className="inline-flex items-center gap-1">
            <Video className="h-3 w-3" />
            {videoType === 'youtube' && 'YouTube Video'}
            {videoType === 'vimeo' && 'Vimeo Video'}
            {videoType === 'direct' && 'Direct Video File'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
