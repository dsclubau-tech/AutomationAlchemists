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
    icon: ElementType;
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
        id: 'cp_bot',
        slug: 'cpbot',
        name: 'CP Bot',
        category: 'ORDER FULFILMENT',
        bannerBg: '#0d1117',
        icon: Box,
        shortDescription: 'One-click copy of eBay customer address directly into Amazon checkout.',
        fullDescription: 'CP Bot is an essential Chrome extension for Amazon-to-eBay dropshippers. It completely eliminates manual data entry by automatically copying your eBay customer\'s address and pasting it seamlessly into the Amazon checkout page with a single click. Save hours of tedious work, prevent human error in shipping addresses, and scale your fulfillment process exponentially.',
        features: [
            { title: 'One-click copy', description: 'Instantly copy the entire eBay customer address structure to your clipboard.', icon: 'mouse-pointer-click' },
            { title: 'Auto-fill checkout', description: 'Paste the exact address directly into Amazon\'s checkout fields without errors.', icon: 'zap' },
            { title: 'Chrome extension', description: 'Works seamlessly in your browser right alongside your regular workflow.', icon: 'chrome' }
        ],
        price: '$9/month',
        isFree: false,
        howItWorks: [
            'Install the CP Bot Chrome extension from the store.',
            'Open your eBay Orders page.',
            'Click the CP Bot button to copy the customer address.',
            'Navigate to Amazon checkout and click to auto-fill.'
        ],
        builtFor: 'Australian eBay sellers who fulfill orders via Amazon and want to eliminate manual data entry.',
        seoKeywords: 'CP Bot, eBay to Amazon fulfillment, address copier, Chrome extension, dropshipping automation, order fulfillment tool',
        appUrl: 'https://cpbot.automationalchemists.com',
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
    },
    {
        id: 'return_label',
        slug: 'returnlabels',
        name: 'Return Label Generator',
        category: 'RETURNS',
        bannerBg: '#100a0d',
        icon: Zap,
        shortDescription: 'Generate eBay return shipping labels instantly. Free for all registered users.',
        fullDescription: 'Handling returns is one of the most frustrating parts of dropshipping. Our Return Label Generator takes the pain out of the process. Instantly generate compliant return shipping labels for your eBay customers, fully compatible with Amazon AU returns, without paying a cent. It\'s completely free for all registered users.',
        features: [
            { title: 'Instant labels', description: 'Generate the label immediately without navigating complex postal sites.', icon: 'zap' },
            { title: 'Amazon AU ready', description: 'Formats match exactly what is required for Amazon Australia returns.', icon: 'check-circle-2' },
            { title: '100% Free', description: 'No subscription required. Just create an account and start using it.', icon: 'gift' }
        ],
        price: 'FREE',
        isFree: true,
        howItWorks: [
            'Sign up for a free Automation Alchemists account.',
            'Go to the Return Label Generator tool in your dashboard.',
            'Enter the required details for the return shipment.',
            'Instantly download your print-ready return label.'
        ],
        builtFor: 'Any Amazon-to-eBay dropshipper who wants a hassle-free, automated way to handle customer returns.',
        seoKeywords: 'Return Label Generator, free eBay return labels, Amazon AU returns, dropshipping returns automation, shipping label creator',
        appUrl: 'https://returnlabel.automationalchemists.com',
    }
];
