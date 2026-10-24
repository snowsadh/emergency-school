import { scenarios } from "../../shared/scenarios.mjs";
import { calculateAssessment } from "../../shared/assessment.mjs";

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
  duration: 120,
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
      text: "So a car and a scooter have collided. How many people are hurt? Is the rider awake?",
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
      text: "Are you safe there?",
      at: 69,
      final: true,
    },
    {
      segmentId: "example-9",
      role: "agent",
      text: "I don’t know. The traffic is really close. I’m not sure if this spot is safe.",
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
      text: "Thank you, Ananya. I have the location as the service road beside Sector 29 flyover in Gurugram, by the blue Metro parking sign. And the rider is awake and talking—is that right?",
      at: 100,
      final: true,
    },
    {
      segmentId: "example-13",
      role: "agent",
      text: "Yes, that’s right. My phone is nearly out of battery. What should I do if the call drops?",
      at: 108,
      final: true,
    },
    {
      segmentId: "example-14",
      role: "user",
      text: "That’s all I needed. You can hang up now.",
      at: 115,
      final: true,
    },
  ],
  review: {
    headline: "Location clarified. Exposure left uncertain.",
    overview:
      "The call-taker clarified a city and landmark and checked the rider’s observable condition. A general safety question did not resolve the caller’s uncertainty about traffic exposure. The call then closed without addressing an explicit concern about losing contact. The total and these omissions need to be read together.",
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
          "The question raises safety, but the caller says they do not know whether their spot is safe. The next question asks for their name instead of clarifying their position relative to the traffic.",
      },
    ],
    nextPractice: {
      title: "Resolve an uncertain safety answer.",
      explanation:
        "In your next practice, notice when a general safety answer still leaves the caller’s position unclear. Ask a focused follow-up before moving to another detail.",
      prompt: "Where are you in relation to the traffic right now?",
    },
  },
};

// These judgments are deliberately authored, not a model evaluation or user activity.
// The same fixed calculator used for live reports supplies the points and total.
exampleSession.review.assessment = calculateAssessment(
  [
    {
      id: "location",
      status: "met",
      evidenceIds: ["example-4", "example-5"],
      rationale:
        "The trainee asks for the city and landmark, producing a usable incident location.",
    },
    {
      id: "location_verification",
      status: "met",
      evidenceIds: ["example-12"],
      rationale:
        "The trainee reads back the city, service road, flyover, and parking landmark.",
    },
    {
      id: "immediate_exposure",
      status: "partial",
      evidenceIds: ["example-8", "example-9", "example-10"],
      rationale:
        "A general safety check is attempted, but the caller cannot say whether their spot is safe. The trainee moves to their name without clarifying the caller’s position relative to traffic.",
    },
    {
      id: "people_at_risk",
      status: "met",
      evidenceIds: ["example-6", "example-7"],
      rationale:
        "The trainee asks how many people are hurt and whether the rider is awake. The caller supplies observations rather than a diagnosis.",
    },
    {
      id: "incident_picture",
      status: "met",
      evidenceIds: ["example-6", "example-7"],
      rationale:
        "The trainee checks that a car and scooter collided and establishes the observable condition of the reported injured rider, without claiming to know the severity.",
    },
    {
      id: "focused_follow_up",
      status: "met",
      evidenceIds: ["example-3", "example-4"],
      rationale:
        "A targeted city-and-landmark follow-up resolves the vague initial flyover location.",
    },
    {
      id: "reconnect_plan",
      status: "missed",
      evidenceIds: ["example-14"],
      opportunityIds: ["example-13"],
      rationale:
        "The caller explicitly asks what to do if the call drops. The trainee closes without a simulated callback detail or reconnect arrangement.",
    },
    {
      id: "factual_confirmation",
      status: "met",
      evidenceIds: ["example-12", "example-13"],
      rationale:
        "The trainee checks the material non-location observation that the rider is awake and talking, and the caller confirms it.",
    },
    {
      id: "closure",
      status: "missed",
      evidenceIds: ["example-14"],
      opportunityIds: ["example-13"],
      rationale:
        "At an explicit contact-loss and closing opportunity, the trainee tells the caller to hang up without a usable simulated next step.",
    },
  ],
  exampleSession.transcript,
);
