export const APP_SIGNUP_URL = 'https://invoice-generator-mu-pearl.vercel.app/signup';
export const APP_PRIVACY_URL = 'https://invoice-generator-mu-pearl.vercel.app/privacy';

export interface InvoiceGeneratorFeatureCard {
  title: string;
  description: string;
  icon: 'FileText' | 'Search' | 'Copy' | 'Download';
}

export interface InvoiceGeneratorStep {
  number: number;
  title: string;
  description: string;
}

export interface InvoiceGeneratorFaqItem {
  question: string;
  answer: string;
}

export interface InvoiceGeneratorScreenshot {
  src: string;
  alt: string;
  caption?: string;
}

export const invoiceGeneratorPageContent = {
  breadcrumb: {
    parent: 'Tools',
    parentHref: '/tools',
    current: 'Invoice Generator',
  },
  parentBrand: 'by Automation Alchemists',
  productName: 'Invoice Generator by Automation Alchemists',
  headline: 'Simple invoices for marketplace sellers.',
  supportingText:
    'Create custom invoices for your customers. Add your business details, download a PDF or send it through Gmail. Free to get started.',
  toolsCardDescription: 'Create, save and send custom invoices for your marketplace customers.',
  audienceLine: 'Built with eBay, Amazon and Walmart sellers in mind.',
  availabilityLine: 'Available for Australia. US, Canada and UK coming soon.',
  mainButtonText: 'Start free',
  separateAccountNote: 'Uses a separate Invoice Generator account for now.',
  features: [
    {
      title: 'Custom invoices',
      description:
        'Add your logo, colours, business details, customer details, items, tax and payment information.',
      icon: 'FileText',
    },
    {
      title: 'Save and find',
      description:
        'Save invoices to your account, search your history and edit them later.',
      icon: 'Search',
    },
    {
      title: 'Reusable templates',
      description:
        'Save business details and email designs to reduce repeat typing.',
      icon: 'Copy',
    },
    {
      title: 'Download or send',
      description:
        'Preview invoices, download PDF or PNG files, or send a PDF through your linked Gmail account.',
      icon: 'Download',
    },
  ] as InvoiceGeneratorFeatureCard[],
  steps: [
    {
      number: 1,
      title: 'Add details',
      description:
        'Add your business details, customer details, items, tax and payment information, or load a saved template.',
    },
    {
      number: 2,
      title: 'Review',
      description:
        'Preview your invoice on screen to review layout, colours, business details and totals.',
    },
    {
      number: 3,
      title: 'Download or send',
      description:
        'Download your invoice as a PDF or PNG file, or send a PDF through your linked Gmail account.',
    },
  ] as InvoiceGeneratorStep[],
  freeAllowance: {
    title: "What's included for free",
    points: [
      'Up to 5 saved invoices at a time (delete one to free a slot);',
      '5 successful Gmail invoice emails each calendar month, resetting at midnight on the 1st of each month, Sydney time;',
      'Creating, previewing or downloading an invoice does not use an email credit;',
      'A Gmail connection is needed to send;',
      'Email credits belong to your Invoice Generator account and are shared across your linked Gmail accounts.',
    ],
    growthSentence: 'Affordable subscription plans are planned as your business grows.',
  },
  // Screenshots pending - render section ONLY when array has items
  screenshots: [] as InvoiceGeneratorScreenshot[],
  faqs: [
    {
      question: 'Do I need a separate account?',
      answer:
        'Yes. You will need a separate Invoice Generator account. It does not use your Automation Alchemists login.',
    },
    {
      question: 'Which countries?',
      answer:
        'Available for Australia. US, Canada and UK coming soon.',
    },
    {
      question: 'What counts toward the free allowance?',
      answer:
        'You can save up to 5 invoices at a time (delete one to free a slot). You also receive 5 successful Gmail invoice emails each calendar month, resetting at midnight on the 1st of each month, Sydney time. Creating, previewing or downloading an invoice does not use an email credit. A Gmail connection is needed to send. Email credits belong to your Invoice Generator account and are shared across your linked Gmail accounts.',
    },
    {
      question: 'What file formats?',
      answer:
        'PDF and PNG. Gmail sending attaches the invoice as a PDF.',
    },
    {
      question: 'Does it connect to eBay, Amazon or Walmart?',
      answer:
        'No direct marketplace integration. It is an invoice tool built with eBay, Amazon and Walmart sellers in mind.',
    },
    {
      question: 'Are paid plans available?',
      answer:
        'Not yet. Affordable subscription plans are planned as your business grows.',
    },
  ] as InvoiceGeneratorFaqItem[],
  closingCard: {
    heading: 'Simple invoices for marketplace sellers.',
    text:
      'Create custom invoices for your customers. Add your business details, download a PDF or send it through Gmail. Free to get started.',
    buttonText: 'Start free',
    note: 'Uses a separate Invoice Generator account for now.',
  },
};
