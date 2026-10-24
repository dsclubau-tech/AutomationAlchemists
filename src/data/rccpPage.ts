export interface RccpIncludedCard {
  title: string;
  description: string;
  icon: 'FileCheck' | 'ShieldCheck' | 'Download' | 'MousePointerClick' | 'MapPinCheck' | 'AlertCircle' | 'Cloud' | 'Gift' | 'History';
}

export const rccpPageContent = {
  breadcrumb: {
    parent: 'Tools',
    parentHref: '/tools',
    current: 'Return Converter x CopyPaste Bot',
  },
  eyebrow: 'ORDER FULFILMENT & RETURNS',
  hero: {
    title: {
      tool1: 'Return Converter',
      separator: '×',
      tool2: 'CopyPaste Bot',
    },
    intro:
      'Two tools for Australian eBay sellers who fulfil through Amazon AU. Return Converter turns Amazon AU return codes into clean eBay return labels, free with your Automation Alchemists account. CopyPaste Bot moves buyer addresses from eBay straight into Amazon checkout, on a monthly subscription.',
    pricing: {
      converterLabel: 'Return Converter',
      converterPrice: 'Free',
      botLabel: 'CopyPaste Bot',
      botPriceFormat: (price: number) => `AUD $${price}/month`,
    },
    buttons: {
      getAccess: 'Get access',
      getAccessBot: 'Get CP Bot',
      useFree: 'Use Return Converter free',
      freeUrl: 'https://rccp.automationalchemists.com',
      trialCta: (days: number) => `Get your ${days}-day free trial now`,
      spotsLeft: (left: number, cap: number) => `${left} of ${cap} free-trial spots left`,
      trialActive: 'Your free trial is active',
      openDashboard: 'Open dashboard',
    },
  },
  returnConverter: {
    heading: 'Return Converter',
    subline: 'Clean eBay return labels from Amazon AU return codes. Free.',
    paragraph:
      'Amazon gives your buyer an Australia Post QR code, a ParcelPoint barcode or a printable return label. None of them look right on an eBay return. Return Converter turns them into a clean, professional return label you can send to your buyer in minutes. It runs in your browser, with nothing to install.',
    steps: [
      'Choose the return method that matches the Amazon AU return.',
      'Upload or drag in the return code, then crop it.',
      'Add the eBay order details.',
      'Download the finished label as PNG, JPG or PDF.',
    ],
    closingNote:
      "Your return image never leaves your browser. Each conversion is logged to a private history, so you keep a record of every return you've processed.",
    cta: 'Use Return Converter free',
  },
  copyPasteBot: {
    heading: 'CopyPaste Bot',
    subline: 'Built to save dropshippers time and money.',
    cards: [
      {
        title: 'Save 1–2 hours a day',
        body: 'Pull buyer shipping addresses from eBay and paste them straight into Amazon checkout. No tab-hopping, no retyping every field.',
      },
      {
        title: 'Fewer costly address typos',
        body: 'Addresses come straight from the eBay order, so you ship to the right buyer the first time. CP Bot then checks what actually landed in Amazon against the order and flags anything that does not match.',
      },
      {
        title: 'You stay in control',
        body: 'CP Bot fills the checkout and stops. It never places an order and never completes a payment — you review and click Place your order yourself.',
      },
      {
        title: 'Cloud copy between browsers',
        body: "Copy a buyer's address in one Chrome browser, profile or computer, then load it in another signed into the same CP Bot account. Each copied address expires after 5 minutes and is then deleted automatically, so it isn't kept.",
      },
    ],
    quickStart: {
      heading: 'Quick start',
      subline: 'Up and running in about 10 minutes.',
      steps: [
        'Log in and install the CP Bot Chrome extension.',
        'Open an eBay order and copy the buyer\'s address in one click.',
        'Open the Amazon checkout, paste, then review and place the order yourself.',
      ],
    },
    forSellers: {
      heading: 'For eBay AU sellers',
      body: 'Built for dropshippers fulfilling on Amazon AU with fewer manual checkout steps.',
    },
  },
  whatsIncluded: {
    heading: "What's included",
    returnConverter: {
      groupLabel: 'RETURN CONVERTER',
      cards: [
        {
          title: 'Australia Post & ParcelPoint',
          description:
            'Five templates: Australia Post QR and printable labels, plus ParcelPoint barcode, printable and pick-up labels.',
          icon: 'FileCheck',
        },
        {
          title: 'Private by design',
          description:
            "Your return image stays in your browser. It's never uploaded or stored on our servers.",
          icon: 'ShieldCheck',
        },
        {
          title: 'Download in any format',
          description:
            'Save each label as PNG, JPG or PDF, ready to send to your buyer.',
          icon: 'Download',
        },
      ] as RccpIncludedCard[],
    },
    copyPasteBot: {
      groupLabel: 'COPYPASTE BOT',
      cards: [
        {
          title: 'One-click copy',
          description:
            'Buyer address from eBay to Amazon checkout in a single click.',
          icon: 'MousePointerClick',
        },
        {
          title: 'Address check',
          description:
            'Confirms the address Amazon saved matches the eBay order.',
          icon: 'MapPinCheck',
        },
        {
          title: 'Product check',
          description:
            'Optional warning when the Amazon item does not match the eBay order.',
          icon: 'AlertCircle',
        },
        {
          title: 'Cloud copy',
          description:
            'Copy in one browser, paste in another. Addresses are deleted after 5 minutes.',
          icon: 'Cloud',
        },
        {
          title: 'Gift messages',
          description:
            'Adds your gift message at checkout, including orders with several items.',
          icon: 'Gift',
        },
        {
          title: 'History',
          description:
            'A record of the orders you process with CP Bot and the return labels you convert.',
          icon: 'History',
        },
      ] as RccpIncludedCard[],
    },
  },
  closingCard: {
    heading: 'Ready to get started?',
    text: 'Join Automation Alchemists and scale your eBay dropshipping business today.',
    button: 'Get access now',
  },
};
