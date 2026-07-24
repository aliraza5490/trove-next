import { cn } from "@/lib/utils"
import { Bot } from "lucide-react"
import Link from "next/link"
import React from 'react'

interface ILogoProps {
    link?: string
    className?: string
    iconClassName?: string
    textClassName?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { icon: 'size-5', text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 'size-7', text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 'size-9', text: 'text-2xl', gap: 'gap-2.5' },
  xl: { icon: 'size-11', text: 'text-3xl', gap: 'gap-3' },
}

const Logo = ({
    link = '/',
    className,
    iconClassName,
    textClassName,
    size = 'md'
}: ILogoProps) => {
  const sizes = sizeMap[size] || sizeMap.md

  return (
    <Link href={link} className={cn("flex items-center justify-start py-2 px-1", sizes.gap, className)}>
        <Bot aria-hidden className={cn(sizes.icon, "text-primary shrink-0", iconClassName)} />
        <span className={cn("font-bold tracking-tight", sizes.text, textClassName)}>Trove</span>
    </Link>
  )
}

export default Logo