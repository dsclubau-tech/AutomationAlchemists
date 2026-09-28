export interface VirtualAssistanceStoryParagraph {
  lead?: string;
  text: string;
}

export interface VirtualAssistanceStory {
  id: string;
  step: number;
  label: string;
  title: string;
  paragraphs: VirtualAssistanceStoryParagraph[];
  videoSrc?: string;
  posterSrc?: string;
  enabled: boolean;
}

export const virtualAssistanceStories: VirtualAssistanceStory[] = [
  {
    id: "story-1",
    step: 1,
    label: "Get started",
    title: "Send It to Someone Who'll Actually Get It Done",
    paragraphs: [
      {
        lead: "Reach out.",
        text: "Send us a message, email us, or call. Explain your problem or plan in whatever level of detail you have."
      },
      {
        lead: "Free consultation.",
        text: "We talk through what you need and whether a virtual assistant is the right fit."
      },
      {
        lead: "Real people, not a queue.",
        text: "Your task goes to a real assistant who reads it and works on it."
      },
      {
        lead: "Built by automation specialists.",
        text: "We build automation systems for a living, so we know which work should stay with a person and which shouldn't."
      }
    ],
    videoSrc: "/videos/va/va-01.mp4",
    enabled: true,
  },
  {
    id: "story-2",
    step: 2,
    label: "Hand it off",
    title: "Hand It Off. They Run With It.",
    paragraphs: [
      { text: "Skip the back-and-forth of explaining every step. Send it over as it is." },
      { text: "A real assistant works through it, organizes it, and gets it into shape." },
      { text: "They come to you only when something truly needs your call." }
    ],
    videoSrc: "/videos/va/va-02.mp4",
    enabled: true,
  },
  {
    id: "story-3",
    step: 3,
    label: "Clear the inbox",
    title: "Every Message Answered, Every Task Closed",
    paragraphs: [
      { text: "Customer questions and everyday requests land with a real assistant, not an inbox that piles up." },
      { text: "They handle each one and confirm it's done, one after another." },
      { text: "You stop being the bottleneck for every reply." },
      { text: "Handled steadily, the inbox stays under control and your time goes back to the work that needs you." }
    ],
    videoSrc: "/videos/va/va-03.mp4",
    enabled: true,
  },
  {
    id: "story-4",
    step: 4,
    label: "Scale up",
    title: "Scale and stay organized.",
    paragraphs: [
      { text: "More listings, more messages, more moving parts: the workload doesn't wait until you're ready." },
      { text: "Add real assistants as the business grows, without the cost and delay of hiring in-house." },
      { text: "Your growth stays on your side of the screen, and the organizing stays on theirs. You focus on growing, and the work stays handled." }
    ],
    videoSrc: "/videos/va/va-04.mp4",
    enabled: true,
  },
  {
    id: "story-5",
    step: 5,
    label: "Get time back",
    title: "Buy Back Your Time",
    paragraphs: [
      { text: "Hours spent on admin are hours you can't spend on anything else." },
      { text: "A real assistant takes the routine, one task at a time, so those hours come back to you." },
      { text: "What you do with them is up to you. Running a business shouldn't mean answering every message and chasing every task yourself. You stay in charge, without being everywhere." }
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
