import { scenarios } from "../../shared/scenarios.mjs";

// A deliberately authored illustration. Never mixed into a user's activity.
export const exampleSession = {
  id: "authored-example",
  kind: "sample",
  example: true,
  scenario: scenarios.find((scenario) => scenario.id === "road-01"),
  setup: {
    mode: "random",
    language: "en",
    difficulty: "challenging",
    domains: [],
  },
  createdAt: null,
  duration: 114,
  transcript: [
    {
      segmentId: "example-1",
      role: "agent",
      text: "There’s been an accident. A scooter, and a car… I’m here but I don’t know what to do.",
      at: 0,
      final: true,
    },
    {
      segmentId: "example-2",
      role: "user",
      text: "I’m here with you. Can you tell me where you are?",
      at: 8,
      final: true,
    },
    {
      segmentId: "example-3",
      role: "agent",
      text: "Near the flyover. Sector 29, I think. There are cars everywhere.",
      at: 16,
      final: true,
    },
    {
      segmentId: "example-4",
      role: "user",
      text: "Which city is that in, and can you see a landmark?",
      at: 25,
      final: true,
    },
    {
      segmentId: "example-5",
      role: "agent",
      text: "Gurugram. The service road beside Sector 29 flyover. There’s a blue Metro parking sign.",
      at: 33,
      final: true,
    },
    {
      segmentId: "example-6",
      role: "user",
      text: "Okay. How many people are hurt? Is the rider awake?",
      at: 47,
      final: true,
    },
    {
      segmentId: "example-7",
      role: "agent",
      text: "Just the rider, I think. He’s sitting on the pavement. He’s talking, but I don’t know how badly he’s hurt.",
      at: 55,
      final: true,
    },
    {
      segmentId: "example-8",
      role: "user",
      text: "Are you somewhere safe, away from the traffic?",
      at: 69,
      final: true,
    },
    {
      segmentId: "example-9",
      role: "agent",
      text: "Yes, I’m on the pavement. Cars are still passing the scooter.",
      at: 76,
      final: true,
    },
    {
      segmentId: "example-10",
      role: "user",
      text: "And what’s your name?",
      at: 88,
      final: true,
    },
    {
      segmentId: "example-11",
      role: "agent",
      text: "Ananya.",
      at: 94,
      final: true,
    },
    {
      segmentId: "example-12",
      role: "user",
      text: "Thank you, Ananya. I have the location as the service road beside Sector 29 flyover in Gurugram, by the blue Metro parking sign.",
      at: 100,
      final: true,
    },
  ],
  review: {
    headline: "Location clarified. Safety checked later.",
    overview:
      "The call-taker confirmed a city and landmark, gathered the caller’s observations about the rider, and then checked exposure to traffic. The safety question came after questions about injuries. Consider that sequence when reviewing this example.",
    moments: [
      {
        kind: "strength",
        segmentId: "example-2",
        title: "Initial acknowledgement",
        comment:
          "A short acknowledgement comes before the first question. The caller is given one clear thing to answer.",
      },
      {
        kind: "strength",
        segmentId: "example-4",
        title: "Location clarification",
        comment:
          "The follow-up asks for a city and a landmark rather than treating “near the flyover” as complete.",
      },
      {
        kind: "opportunity",
        segmentId: "example-8",
        title: "Caller safety check",
        comment:
          "The first direct question about the caller’s safety comes here. Reflect on whether you would want to establish their exposure to traffic sooner.",
      },
    ],
    nextPractice: {
      title: "Check immediate exposure earlier.",
      explanation:
        "In your next practice, notice the order in which you establish location, immediate danger, and what has happened. There is no score attached to this prompt.",
      prompt:
        "What do I need to understand before asking for more incident detail?",
    },
  },
};
