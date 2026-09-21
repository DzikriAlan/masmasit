import { Inbox, LoaderCircle, LogIn, ServerCrash, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'

import { cn, loginHref } from '@/shared/lib/utils'

export interface LoadDataResponse {
  data?: unknown
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  /* Every listing table's RLS grants SELECT to `authenticated` only, so a
     signed-out visitor gets zero rows rather than an error. Without this
     branch that reads as "there is nothing here", which is the wrong story
     to tell someone who just arrived from Google. */
  isSignedOut?: boolean
  isNoVerified?: boolean
  errorTitle?: string
  errorSubtitle?: string
  errorImage?: string
  emptyTitle?: string
  emptySubtitle?: string
  emptyImage?: string
  signedOutTitle?: string
  signedOutSubtitle?: string
  signedOutCta?: string
  signedOutCtaAlt?: string
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
  // Checked before isEmpty: a signed-out visitor is always also "empty", and
  // the sign-in explanation is the more useful of the two.
  if (response?.isSignedOut) {
    return {
      title: response.signedOutTitle,
      subtitle: response.signedOutSubtitle,
    }
  }
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
  if (response?.isSignedOut) return <LogIn size={size} color={color} aria-hidden />
  if (response?.isError) return <ServerCrash size={size} color={color} aria-hidden />
  if (response?.isNoVerified) return <ShieldAlert size={size} color={color} aria-hidden />
  return <Inbox size={size} color={color} aria-hidden />
}

/* Plain links rather than <Button asChild>: this file is imported by both
   server and client components, and keeping it free of client-only imports
   means the gate can appear anywhere a list can. */
function SignInActions({ cta, ctaAlt }: Readonly<{ cta?: string; ctaAlt?: string }>) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <Link
        href="/register"
        className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {cta ?? 'Get Started'}
      </Link>
      <Link
        href={loginHref()}
        className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:bg-muted"
      >
        {ctaAlt ?? 'Sign in'}
      </Link>
    </div>
  )
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
      {response?.isSignedOut && (
        <SignInActions cta={response.signedOutCta} ctaAlt={response.signedOutCtaAlt} />
      )}
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
