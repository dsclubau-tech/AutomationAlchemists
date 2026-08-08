import { ElementType } from 'react';
import { Box, Zap, FileText, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export interface ToolFeature {
    title: string;
    description: string;
    icon: string;
}

export interface ToolData {
    id: string;
    slug: string;
    name: string;
    category: string;
    bannerBg: string;
    icon?: ElementType; // Make icon optional so we can use logo image for rccp
    shortDescription: string;
    fullDescription: string;
    features: ToolFeature[];
    price: string;
    isFree: boolean;
    howItWorks: string[];
    builtFor: string;
    seoKeywords: string;
    appUrl?: string; // App link if applicable
}

export const toolsData: ToolData[] = [
    {
        id: 'rccp',
        slug: 'rccp',
        name: 'CP Bot & Return Converter',
        category: 'Order Fulfilment & Returns',
        bannerBg: '#0d1117',
        icon: Box,
        shortDescription: 'One-click eBay to Amazon order fulfilment plus instant return label generation — two tools in one platform.',
        fullDescription: 'CP Bot & Return Converter is an essential toolkit for Amazon-to-eBay dropshippers. It completely eliminates manual data entry by automatically copying your eBay customer\'s address and pasting it seamlessly into the Amazon checkout page with a single click. Additionally, generate compliant return shipping labels for your eBay customers, fully compatible with Amazon AU returns, without paying a cent for the Return Converter module.',
        features: [
            { title: 'One-click copy', description: 'Copy eBay address to Amazon in one click', icon: 'mouse-pointer-click' },
            { title: 'Instant labels', description: 'Generate eBay return labels instantly', icon: 'zap' },
            { title: 'History tracking', description: 'Fulfilment history and activity tracking', icon: 'line-chart' },
            { title: 'Cloud clipboard', description: 'Cloud clipboard for cross-device sync', icon: 'cloud' }
        ],
        price: 'Return Converter: Free | CP Bot: A$9/mo',
        isFree: false,
        howItWorks: [
            'Install the CP Bot Chrome extension or log in to the dashboard.',
            'Copy the customer address directly to Amazon checkout.',
            'Use the dashboard to generate instant return labels.',
            'Manage all your fulfillment needs in one place.'
        ],
        builtFor: 'Australian eBay sellers who fulfill orders via Amazon and want to eliminate manual data entry and handle returns effortlessly.',
        seoKeywords: 'CP Bot, Return Converter, eBay to Amazon fulfillment, return label generator, address copier, Chrome extension, dropshipping automation',
        appUrl: 'https://rccp.automationalchemists.com',
    },
    {
        id: 'list_flow',
        slug: 'listflow',
        name: 'ListFlow',
        category: 'PRODUCT MANAGEMENT',
        bannerBg: '#0a0d0a',
        icon: Sparkles,
        shortDescription: 'Track, list, and monitor products across eBay. A faster AutoDS alternative.',
        fullDescription: 'ListFlow is a streamlined, lightning-fast alternative to bloated tools like AutoDS, designed specifically for the needs of Amazon-to-eBay sellers. Track products, list them in bulk, and monitor prices and inventory automatically. No unnecessary features, just pure performance to help you manage your store efficiently without the lag.',
        features: [
            { title: 'Bulk listing', description: 'Import and list dozens of products from Amazon to eBay in seconds.', icon: 'layers' },
            { title: 'Price monitoring', description: 'Get alerts when prices change on Amazon to protect your margins.', icon: 'line-chart' },
            { title: 'Inventory sync', description: 'Automatically update your stock levels when items go out of stock.', icon: 'refresh-cw' }
        ],
        price: '$19/month',
        isFree: false,
        howItWorks: [
            'Connect your eBay store securely via our dashboard.',
            'Input Amazon product URLs or ASINs to import items.',
            'Review and customize the listings in bulk.',
            'Publish directly to eBay and let ListFlow monitor the rest.'
        ],
        builtFor: 'Sellers looking for a fast, reliable, and cost-effective way to manage their eBay inventory without the bloat of traditional tools.',
        seoKeywords: 'ListFlow, AutoDS alternative, eBay listing tool, price monitoring, inventory sync, bulk listing, dropshipping software',
        appUrl: 'https://listflow.automationalchemists.com',
    },
    {
        id: 'order_bot',
        slug: 'orderbot',
        name: 'Order Bot',
        category: 'NOTIFICATIONS',
        bannerBg: '#0d0d0a',
        icon: Activity,
        shortDescription: 'Get instant WhatsApp or Discord alerts the moment you receive a new eBay order.',
        fullDescription: 'Never miss a sale again. Order Bot connects directly to your eBay store and sends instant, real-time alerts straight to your WhatsApp or Discord the second an order comes in. Stay on top of your business from anywhere, ensuring you can fulfill orders promptly and provide top-tier customer service.',
        features: [
            { title: 'WhatsApp alerts', description: 'Receive a message directly to your phone the instant a sale occurs.', icon: 'message-circle' },
            { title: 'Discord integration', description: 'Push order notifications to a dedicated channel in your Discord server.', icon: 'hash' },
            { title: 'Real-time speed', description: 'Alerts are delivered in milliseconds, ensuring you can act fast.', icon: 'clock' }
        ],
        price: '$7/month',
        isFree: false,
        howItWorks: [
            'Link your eBay account in the Order Bot dashboard.',
            'Choose your preferred notification channel (WhatsApp or Discord).',
            'Follow the prompt to connect your number or server.',
            'Start receiving instant alerts for every sale.'
        ],
        builtFor: 'Sellers who want to stay informed of their sales in real-time, away from their desks.',
        seoKeywords: 'Order Bot, eBay sales notifications, WhatsApp alerts, Discord alerts for eBay, real-time sales tracking, dropshipping notifications',
        appUrl: 'https://orderbot.automationalchemists.com',
    },
    {
        id: 'invoice_generator',
        slug: 'invoicegen',
        name: 'Invoice Generator',
        category: 'INVOICING',
        bannerBg: '#0a0d10',
        icon: FileText,
        shortDescription: 'Auto-generate professional invoices for your eBay sales in one click.',
        fullDescription: 'Provide professional, compliant invoices to your customers with zero effort. The Invoice Generator pulls data directly from your eBay sales to instantly create custom-branded, ready-to-export PDF invoices. Enhance your brand credibility and streamline your accounting process.',
        features: [
            { title: 'One-click creation', description: 'Generate a full invoice directly from the order page instantly.', icon: 'file-text' },
            { title: 'Custom branding', description: 'Add your store\'s logo, address, and ABN to look highly professional.', icon: 'image' },
            { title: 'PDF export', description: 'Download ready-to-send PDF files that you can easily attach to messages.', icon: 'download' }
        ],
        price: '$5/month',
        isFree: false,
        howItWorks: [
            'Connect your store and upload your logo/branding details.',
            'View your recent eBay orders in the dashboard.',
            'Click "Generate" on any order to create the invoice.',
            'Download the PDF or email it directly to the customer.'
        ],
        builtFor: 'Professional sellers who need to provide compliant, branded tax invoices quickly and easily.',
        seoKeywords: 'eBay invoice generator, automated invoicing, dropshipping tax invoice, custom branded invoice, PDF invoice maker',
        appUrl: 'https://invoicegen.automationalchemists.com',
    }
];
