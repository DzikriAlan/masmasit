import { Inbox, LoaderCircle, ServerCrash, ShieldAlert } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface LoadDataResponse {
  data?: unknown
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  isNoVerified?: boolean
  errorTitle?: string
  errorSubtitle?: string
  errorImage?: string
  emptyTitle?: string
  emptySubtitle?: string
  emptyImage?: string
  noVerifiedTitle?: string
  noVerifiedSubtitle?: string
  noVerifiedImage?: string
}

interface Props {
  response?: LoadDataResponse
  customLoader?: boolean
  icon?: React.ReactNode
  /** Text-only empty/error state — no icon and no fallback icon either. */
  hideIcon?: boolean
  sizeIcon?: number
  colorIcon?: string
  colorTitle?: string
  colorSubtitle?: string
  sizeImage?: number
  sizeTitle?: number
  sizeSubtitle?: number
  minHeight?: string
  className?: string
  children?: React.ReactNode
}

interface Placeholder {
  title?: string
  subtitle?: string
  image?: string
}

function getPlaceholder(response?: LoadDataResponse): Placeholder | null {
  if (response?.isEmpty) {
    return {
      title: response.emptyTitle,
      subtitle: response.emptySubtitle,
      image: response.emptyImage,
    }
  }
  if (response?.isError) {
    return {
      title: response.errorTitle,
      subtitle: response.errorSubtitle,
      image: response.errorImage,
    }
  }
  if (response?.isNoVerified) {
    return {
      title: response.noVerifiedTitle,
      subtitle: response.noVerifiedSubtitle,
      image: response.noVerifiedImage,
    }
  }
  return null
}

function getSizeStyle(size?: number): React.CSSProperties {
  return size ? { width: `${size}px`, height: `${size}px` } : {}
}

function getTextStyle(color?: string, size?: number): React.CSSProperties {
  return {
    ...(color ? { color } : {}),
    ...(size ? { fontSize: `${size}px` } : {}),
  }
}

function FallbackIcon({
  response,
  size,
  color,
}: Readonly<{ response?: LoadDataResponse; size: number; color?: string }>) {
  if (response?.isError) return <ServerCrash size={size} color={color} aria-hidden />
  if (response?.isNoVerified) return <ShieldAlert size={size} color={color} aria-hidden />
  return <Inbox size={size} color={color} aria-hidden />
}

function PlaceholderSection({
  placeholder,
  response,
  icon,
  hideIcon,
  mediaStyle,
  iconSize,
  colorIcon,
  titleStyle,
  subtitleStyle,
}: Readonly<{
  placeholder: Placeholder
  response?: LoadDataResponse
  icon?: React.ReactNode
  hideIcon?: boolean
  mediaStyle: React.CSSProperties
  iconSize: number
  colorIcon?: string
  titleStyle: React.CSSProperties
  subtitleStyle: React.CSSProperties
}>) {
  return (
    <div className="empty-data flex h-full flex-col items-center gap-1 py-10 text-center">
      {!hideIcon && (
        placeholder.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={placeholder.image} style={mediaStyle} alt="illustration" />
        ) : (
          <span style={mediaStyle} className="text-muted-foreground mb-2">
            {icon ?? <FallbackIcon response={response} size={iconSize} color={colorIcon} />}
          </span>
        )
      )}
      <p className="text-sm font-semibold" style={titleStyle}>
        {placeholder.title ?? ''}
      </p>
      <p className="text-muted-foreground text-sm" style={subtitleStyle}>
        {placeholder.subtitle ?? ''}
      </p>
    </div>
  )
}

export function LoadData({
  response,
  customLoader,
  icon,
  hideIcon,
  sizeIcon,
  colorIcon,
  colorTitle,
  colorSubtitle,
  sizeImage,
  sizeTitle,
  sizeSubtitle,
  minHeight,
  className,
  children,
}: Readonly<Props>) {
  const isLoading = response?.isLoading ?? false
  const wrapperStyle = minHeight ? { minHeight } : undefined
  const mediaStyle = { ...getSizeStyle(sizeIcon), ...getSizeStyle(sizeImage) }
  const placeholder = getPlaceholder(response)

  if (isLoading && !customLoader) {
    return (
      <div
        style={wrapperStyle}
        className={cn(
          'flex items-center justify-center',
          !minHeight && 'min-h-[30vh]',
          className,
        )}
      >
        <LoaderCircle
          className="text-muted-foreground size-6 animate-spin"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  if (!isLoading && placeholder) {
    return (
      <div
        style={wrapperStyle}
        className={cn(
          'flex flex-col justify-center',
          // Same fallback height as the loading branch above — otherwise a
          // spinner at 30vh swaps for a content-sized empty/error block and
          // the page visibly jumps the moment loading finishes.
          !minHeight && 'min-h-[30vh]',
          className,
        )}
      >
        <PlaceholderSection
          placeholder={placeholder}
          response={response}
          icon={icon}
          hideIcon={hideIcon}
          mediaStyle={mediaStyle}
          iconSize={sizeIcon ?? sizeImage ?? 40}
          colorIcon={colorIcon}
          titleStyle={getTextStyle(colorTitle, sizeTitle)}
          subtitleStyle={getTextStyle(colorSubtitle, sizeSubtitle)}
        />
      </div>
    )
  }

  return (
    <div style={wrapperStyle} className={className}>
      {children}
    </div>
  )
}
