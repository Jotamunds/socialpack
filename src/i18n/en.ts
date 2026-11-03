/**
 * English copy for the sale site. Add pt.ts later with the same shape
 * (`satisfies LocaleMessages` from this object). No prices, secrets, or live customer data.
 */
export const en = {
  meta: {
    title: "SocialPack — A week of posts, ready to publish",
    titleTemplate: "%s | SocialPack",
    description:
      "Add your niche and brand colors. Get 7 square posts and captions for the week.",
    ogTitle: "SocialPack — A week of posts, ready to publish",
    ogDescription:
      "On-brand graphics and captions for the week, from your niche and colors.",
    loginTitle: "Log in",
    loginDescription: "Log in to manage your brands and weekly posts.",
    signupTitle: "Create your account",
    signupDescription: "Create a SocialPack account and start this week's graphics.",
  },
  brand: {
    logoFull: "SocialPack logo",
    logoIcon: "SocialPack icon",
  },
  hero: {
    navLabel: "Page sections",
    features: "Features",
    logIn: "Log in",
    title: "Weekly posts and captions for your business",
    subtitle:
      "Tell us your niche and your colors. Get 7 1080\u00A0×\u00A01080 posts and captions.",
    cta: "Start creating",
    scrollHint: "Scroll to see how it works",
    cardPizzeria: "Pizzeria",
    cardPizza: "House pizza",
    cardCafe: "Cafe",
    cardCoffee: "Morning coffee",
    cardBeauty: "Beauty",
    cardLook: "Natural look",
    cardDraft: "Draft",
    badgeInstagram: "Instagram",
    badgeYouTube: "YouTube",
    badgeTikTok: "TikTok",
    badgeMessage: "Message",
    badgeVideo: "Video",
  },
  howItWorks: {
    eyebrow: "Simple and fast",
    title: "How SocialPack builds your posts",
    subtitle: "Three short steps to a week of posts you can publish.",
    step1Title: "Your business, on brand",
    step1Body:
      "Name the business, pick a niche from 36+ options, set the city, and choose your brand colors.",
    step2Title: "A consistent week",
    step2Body:
      "Curated templates and captions shaped for your niche, so every post looks like it belongs.",
    step3Title: "Download and post",
    step3Body:
      "Save all 7 graphics as 1080×1080 PNGs, or grab a ZIP with captions ready to paste.",
  },
  examples: {
    eyebrow: "Real posts",
    title: "From the demo account",
    subtitle: "Up to four finished posts, at 1080×1080.",
    cta: "Open the demo",
  },
  footer: {
    rights: "All rights reserved.",
    logIn: "Log in",
    createAccount: "Create account",
  },
  login: {
    title: "Welcome back",
    subtitle: "Log in to manage your brands and weekly posts.",
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    submit: "Log in",
    submitting: "Logging in...",
    loading: "Loading...",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    invalidEmail: "Enter a valid email.",
    passwordRequired: "Enter your password.",
    checkFields: "Check your email and password.",
    invalidCredentials: "That email or password is incorrect.",
    unexpected: "We couldn't log you in. Try again.",
  },
  signup: {
    title: "Create your account",
    subtitle: "Add your details and start this week's graphics.",
    fullName: "Full name",
    fullNamePlaceholder: "Your full name",
    phone: "Mobile",
    phonePlaceholder: "(555) 555-0100",
    email: "Work email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    submit: "Create account",
    submitting: "Creating account...",
    loading: "Loading...",
    hasAccount: "Already have an account?",
    logIn: "Log in",
    checkFields: "Check the form and try again.",
    nameInvalid: "Enter your full name (at least 3 characters).",
    phoneInvalid: "Enter a valid phone number.",
    emailInvalid: "Enter a valid email.",
    passwordInvalid: "Use at least 6 characters.",
    emailTaken: "This email is already registered. Try logging in.",
    confirmEmail: "Account created. Confirm your email, then log in.",
    unexpected: "We couldn't create your account. Try again.",
  },
} as const;

export type LocaleMessages = typeof en;
