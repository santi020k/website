import type { SiteConfig, SiteLink } from './types/site'

export const siteConfig: SiteConfig = {
  availability: 'Open to tech lead, full-stack, and engineering leadership roles',
  author: 'Santiago Molina Orozco',
  contact: {
    email: 'santiago@santi020k.com',
    github: 'https://github.com/santi020k',
    linkedin: 'https://linkedin.com/in/santi020k',
    medium: 'https://medium.com/@santi020k',
    resume: '/pdf/cv.pdf',
    whatsapp: 'https://api.whatsapp.com/send?phone=573507990136&text=Hi%2C%20I%20came%20across%20your%20website%20and%20wanted%20to%20get%20in%20touch'
  },
  date: {
    locale: 'en-US',
    options: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  description: 'Engineering leader and full-stack architect specializing in resilient systems, technical leadership, and developer experience. Exploring the intersection of human teams and high-scale software.',
  headline: 'I lead engineering teams, architect resilient systems, and build tools that empower developers.',
  lang: 'en-US',
  location: 'Medellin, Colombia · Remote worldwide',
  ogLocale: 'en_US',
  socialLinks: [
    {
      href: 'https://linkedin.com/in/santi020k',
      icon: 'tabler:brand-linkedin',
      label: 'LinkedIn'
    },
    {
      href: 'https://github.com/santi020k',
      icon: 'tabler:brand-github',
      label: 'GitHub'
    },
    {
      href: 'https://medium.com/@santi020k',
      icon: 'tabler:brand-medium',
      label: 'Medium'
    },
    {
      href: 'https://api.whatsapp.com/send?phone=573507990136&text=Hi%2C%20I%20came%20across%20your%20website%20and%20wanted%20to%20get%20in%20touch',
      icon: 'tabler:brand-whatsapp',
      label: 'WhatsApp'
    }
  ],
  title: 'Santiago Molina'
}

export const menuLinks: SiteLink[] = [
  {
    path: '/',
    title: 'Home'
  },
  {
    path: '/about/',
    title: 'About'
  },
  {
    path: '/portfolio/',
    title: 'Portfolio'
  },
  {
    path: '/speaking/',
    title: 'Speaking'
  },
  {
    path: '/blog/',
    title: 'Blog'
  }
]
