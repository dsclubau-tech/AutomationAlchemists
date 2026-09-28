export interface VirtualAssistanceStory {
  id: string;
  step: number;
  label: string;
  title: string;
  paragraphs: string[];
  videoSrc?: string;
  posterSrc?: string;
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
    videoSrc: "/videos/va/va-01.mp4",
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
    videoSrc: "/videos/va/va-02.mp4",
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
    videoSrc: "/videos/va/va-03.mp4",
    enabled: true,
  },
  {
    id: "story-4",
    step: 4,
    label: "Stay organized",
    title: "Keep the Details Under Control",
    paragraphs: [
      "Listings, orders, files and follow-ups pile up fast. A real assistant keeps track of all of it.",
      "Details get checked, updates get made, and nothing slips through the cracks.",
      "You always know where things stand without having to ask."
    ],
    videoSrc: "/videos/va/va-04.mp4",
    enabled: true,
  },
  {
    id: "story-5",
    step: 5,
    label: "Build the relationship",
    title: "A Real Person Who Learns How You Work",
    paragraphs: [
      "The same assistant gets to know your business, your preferences and the way you like things done.",
      "Over time, handoffs get faster and you explain less.",
      "It feels less like outsourcing and more like having a teammate."
    ],
    videoSrc: "/videos/va/va-05.mp4",
    enabled: true,
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
