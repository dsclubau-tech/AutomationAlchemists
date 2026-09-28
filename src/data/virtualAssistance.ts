export interface VirtualAssistanceStory {
  id: string;
  step: number;
  label: string;
  title: string;
  paragraphs: string[];
  videoSrc?: string;
  posterSrc?: string;
  ctaHref?: string;
  enabled: boolean;
}

export const virtualAssistanceStories: VirtualAssistanceStory[] = [
  {
    id: "story-1",
    step: 1,
    label: "Send the task",
    title: "Send It to Someone Who'll Actually Get It Done",
    paragraphs: [
      "No portals. No support tickets. No queue.",
      "You send an email, a voice note, or a Slack message. We pick it up and handle it."
    ],
    ctaHref: "/contact",
    enabled: true,
  },
  {
    id: "story-2",
    step: 2,
    label: "Restore order",
    title: "Hand Off the Mess. Get Back Order.",
    paragraphs: [
      "Inbox zero isn't a myth. Data entry doesn't have to be your evening.",
      "Our assistants thrive in the messy operational details so you can focus on building your business."
    ],
    ctaHref: "/contact",
    enabled: true,
  },
  {
    id: "story-3",
    step: 3,
    label: "Build momentum",
    title: "One at a Time, It Adds Up",
    paragraphs: [
      "Every task handed off is time bought back.",
      "We provide the operational leverage you need to keep moving fast."
    ],
    ctaHref: "/contact",
    enabled: true,
  },
  {
    id: "story-4",
    step: 4,
    label: "Scale seamlessly",
    title: "Prepared for the next chapter",
    paragraphs: [
      "Placeholder content for scaling your operations."
    ],
    ctaHref: "/contact",
    enabled: false,
  },
  {
    id: "story-5",
    step: 5,
    label: "Advanced delegation",
    title: "Leveling up your operations",
    paragraphs: [
      "Placeholder content for advanced operations."
    ],
    ctaHref: "/contact",
    enabled: false,
  },
  {
    id: "story-6",
    step: 6,
    label: "Maximum leverage",
    title: "Unstoppable momentum",
    paragraphs: [
      "Placeholder content for ultimate leverage."
    ],
    ctaHref: "/contact",
    enabled: false,
  }
];

export interface VirtualAssistanceStats {
  value: string;
  label: string;
  enabled: boolean;
}

export const virtualAssistanceStats: VirtualAssistanceStats[] = [
  // Example stats. Set enabled: false since we have no real numbers yet.
  {
    value: "10,000+",
    label: "Hours saved for our clients",
    enabled: false,
  },
  {
    value: "24h",
    label: "Average turnaround time",
    enabled: false,
  }
];
