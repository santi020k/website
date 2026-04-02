import type { SiteConfig, SiteLink } from '@/types'

export const siteConfig: SiteConfig = {
  availability: 'Available for senior frontend, full stack, and tech lead roles',
  author: 'Santi020k',
  contact: {
    email: 'santi020k@gmail.com',
    github: 'https://github.com/santi020k',
    linkedin: 'https://linkedin.com/in/santi020k',
    medium: 'https://medium.com/@santi020k',
    resume: '/pdf/cv.pdf',
    whatsapp: 'https://api.whatsapp.com/send?phone=37257899454&text=Hi%2C%20I%20came%20across%20your%20website%20and%20wanted%20to%20get%20in%20touch'
  },
  date: {
    locale: 'en-US',
    options: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  description: 'Portfolio, case studies, and writing from Santiago Molina about frontend architecture, product engineering, and modern web systems.',
  headline: 'Building fast, elegant products with strong systems behind them.',
  lang: 'en-US',
  location: 'Colombia · Remote-friendly',
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
      href: 'https://api.whatsapp.com/send?phone=37257899454&text=Hi%2C%20I%20came%20across%20your%20website%20and%20wanted%20to%20get%20in%20touch',
      icon: 'tabler:brand-whatsapp',
      label: 'WhatsApp'
    }
  ],
  title: 'Santi020k'
}

export const menuLinks: SiteLink[] = [
  {
    path: '/',
    title: 'Home'
  },
  {
    path: '/portfolio/',
    title: 'Portfolio'
  },
  {
    path: '/posts/',
    title: 'Blog'
  },
  {
    path: '/technologies/',
    title: 'Stack'
  }
]
