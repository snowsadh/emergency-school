// Product-authored weights and anchors, informed by APCO's public training topics.
// This is not an APCO score, an agency protocol, or a validated Indian 112 standard.
export const rubricVersion = "call-handling-v1";
export const assessmentSource = {
  title: "APCO public call-taker training topics, Chapter 7",
  url: "https://atpa.apcointl.org/guest/chapter-7",
  sections: ["7.2.2", "7.2.3", "7.2.4", "7.5", "7.6"],
  note: "The criteria, weights, half-credit rule, and coverage threshold are prototype design choices, not a published or validated scoring standard.",
};

export const assessmentRubric = Object.freeze(
  [
    {
      id: "location",
      label: "Incident location",
      weight: 20,
      critical: true,
      expected:
        "Establish a usable incident location from the information the caller can provide.",
      met: "A specific location is elicited or acknowledged, with enough available detail to distinguish the incident site.",
      partial:
        "The trainee establishes an area but leaves a resolvable address, access point, or landmark ambiguity.",
      missed:
        "An explicit location-related opportunity is passed over, or the trainee proceeds using a demonstrably wrong location.",
      nextAction:
        "Ask for the location and clarify the most useful available address, access point, or landmark.",
    },
    {
      id: "location_verification",
      label: "Location verification",
      weight: 10,
      critical: false,
      expected:
        "Check the location rather than treating an ambiguous first answer as confirmed.",
      met: "The trainee checks a stated location with a read-back or a targeted clarification that resolves its ambiguity.",
      partial:
        "A location check is attempted but an available, material ambiguity remains unresolved.",
      missed:
        "A conflicting or unclear location is heard and the trainee explicitly moves on without checking it.",
      nextAction:
        "Read back the location or ask a focused question about the unresolved location detail.",
    },
    {
      id: "immediate_exposure",
      label: "Immediate exposure",
      weight: 15,
      critical: true,
      expected:
        "Establish the caller's present exposure to danger without requesting unsafe action.",
      met: "The trainee checks the caller's position relative to the observed hazard, or clearly acknowledges a known safe position.",
      partial:
        "A general safety question is asked but a disclosed, resolvable exposure remains unclear.",
      missed:
        "A disclosed immediate exposure is passed over at a clear opportunity, or the trainee asks the caller to enter known danger.",
      nextAction:
        "Clarify where the caller is in relation to the hazard; do not ask them to approach or investigate it.",
    },
    {
      id: "people_at_risk",
      label: "People at risk",
      weight: 10,
      critical: false,
      expected:
        "Clarify who may be affected and the observable information relevant to their safety.",
      met: "Questions establish the available number or identity of affected people and relevant observations without diagnosis.",
      partial:
        "Some affected-person information is established, but an available material detail is not clarified.",
      missed:
        "An explicit reference to an affected person is passed over despite a clear opportunity to ask or acknowledge it.",
      nextAction:
        "Ask who is affected and what the caller can actually observe; accept information they genuinely do not know.",
    },
    {
      id: "incident_picture",
      label: "Incident picture",
      weight: 15,
      critical: false,
      expected:
        "Build an accurate account of what is happening from observations, not unsupported assumptions.",
      met: "The trainee elicits or checks the incident's nature and material observations, separating uncertainty from fact.",
      partial:
        "The incident type is established, but a disclosed material ambiguity remains unexamined.",
      missed:
        "The trainee proceeds on a contradicted assumption or explicitly passes over a material incident observation.",
      nextAction:
        "Ask what happened and what the caller can see, then clarify the most important remaining uncertainty.",
    },
    {
      id: "focused_follow_up",
      label: "Focused follow-up",
      weight: 10,
      critical: false,
      expected:
        "Use relevant, answerable follow-up questions to resolve a detail or help a fragmented caller respond.",
      met: "A focused follow-up addresses a specific answer, uncertainty, or communication difficulty evidenced in the conversation.",
      partial:
        "A relevant follow-up is attempted, but its wording leaves the caller's stated uncertainty unresolved.",
      missed:
        "An explicit clarification opportunity is ignored or replaced by questions that demonstrably prevent a usable answer.",
      nextAction:
        "Ask one specific question about the last unclear answer, rather than introducing several new questions.",
    },
    {
      id: "reconnect_plan",
      label: "Contact and reconnect plan",
      weight: 10,
      critical: false,
      expected:
        "Establish a simulated way to reconnect if contact is lost; never request a real telephone number.",
      met: "The trainee confirms a simulated callback/contact detail or states a clear fictional reconnect arrangement.",
      partial:
        "The trainee starts a contact check but does not establish the simulated reconnect detail or arrangement.",
      missed:
        "A disconnect concern or explicit call-closing opportunity occurs and the trainee proceeds without a simulated reconnect arrangement.",
      nextAction:
        "Ask to confirm the simulated callback detail, or state what the fictional caller should do if disconnected.",
    },
    {
      id: "factual_confirmation",
      label: "Factual confirmation",
      weight: 5,
      critical: false,
      expected:
        "Check a material non-location detail and avoid repeating assumptions as confirmed facts.",
      met: "The trainee accurately confirms or resolves a material incident detail beyond the location.",
      partial:
        "A relevant confirmation is attempted but remains incomplete or does not resolve a disclosed discrepancy.",
      missed:
        "The trainee repeats a contradicted material fact or explicitly proceeds despite a disclosed factual discrepancy.",
      nextAction:
        "Read back one important non-location detail and invite correction without adding facts.",
    },
    {
      id: "closure",
      label: "Closure and expectations",
      weight: 5,
      critical: false,
      expected:
        "When the conversation reaches a closing opportunity, set an accurate simulated next step or contact expectation.",
      met: "The trainee makes the simulated next step or continued-contact expectation clear without claiming actual dispatch.",
      partial:
        "A closing or continued-contact expectation is attempted but the next step remains unclear.",
      missed:
        "At an explicit closing opportunity the trainee ends with no usable expectation, or falsely claims that real help was dispatched.",
      nextAction:
        "Explain the next step within the simulation and whether the caller should remain in contact; do not claim real dispatch.",
    },
  ].map((criterion) => Object.freeze(criterion)),
);

const statuses = new Set(["met", "partial", "missed", "not_assessable"]);
const multipliers = { met: 1, partial: 0.5, missed: 0 };

function usableText(value, maxLength = 1200) {
  return typeof value === "string" && value.trim() && value.length <= maxLength
    ? value.trim()
    : "";
}

export function calculateAssessment(judgements, transcript = []) {
  const turns = Array.isArray(transcript) ? transcript : [];
  const counts = new Map();
  for (const turn of turns) {
    if (typeof turn?.segmentId === "string")
      counts.set(turn.segmentId, (counts.get(turn.segmentId) || 0) + 1);
  }
  const evidence = new Map();
  turns.forEach((turn, index) => {
    if (
      counts.get(turn?.segmentId) === 1 &&
      turn.final !== false &&
      ["user", "agent"].includes(turn.role) &&
      usableText(turn.text, 5000) &&
      !(turn.role === "agent" && turn.playbackConfirmed === false)
    )
      evidence.set(turn.segmentId, { ...turn, index });
  });
  const proposed = Array.isArray(judgements) ? judgements : [];

  const criteria = assessmentRubric.map((criterion) => {
    const matches = proposed.filter((item) => item?.id === criterion.id);
    const judgement = matches.length === 1 ? matches[0] : null;
    let status = "not_assessable";
    let evidenceIds = [];
    let rationale =
      matches.length > 1
        ? "Conflicting duplicate judgements were excluded."
        : "No grounded judgement is available for this criterion.";

    if (judgement && statuses.has(judgement.status)) {
      const ids = Array.isArray(judgement.evidenceIds)
        ? judgement.evidenceIds
        : [];
      const opportunities = Array.isArray(judgement.opportunityIds)
        ? judgement.opportunityIds
        : [];
      const allIds = [...new Set([...ids, ...opportunities])];
      const validIds =
        allIds.length <= 20 &&
        allIds.every((id) => typeof id === "string" && evidence.has(id));
      const traineeIds = ids.filter((id) => evidence.get(id)?.role === "user");
      const reason = usableText(judgement.rationale);
      const opportunityFollowed = opportunities.some((id) => {
        const opportunity = evidence.get(id);
        return (
          opportunity &&
          traineeIds.some(
            (traineeId) => evidence.get(traineeId).index >= opportunity.index,
          )
        );
      });

      if (judgement.status === "not_assessable") {
        rationale =
          reason ||
          "This session does not provide enough evidence to judge this criterion.";
      } else if (
        validIds &&
        traineeIds.length > 0 &&
        reason &&
        (judgement.status !== "missed" || opportunityFollowed)
      ) {
        status = judgement.status;
        evidenceIds = allIds;
        rationale = reason;
      } else {
        rationale =
          "The proposed judgement lacked valid trainee evidence or a grounded opportunity and was excluded.";
      }
    }

    return {
      id: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      critical: criterion.critical,
      status,
      points:
        status === "not_assessable"
          ? null
          : criterion.weight * multipliers[status],
      evidenceIds,
      rationale,
      expected: criterion.expected,
      nextAction: status === "met" ? "" : criterion.nextAction,
    };
  });

  const earned = criteria.reduce(
    (sum, criterion) => sum + (criterion.points ?? 0),
    0,
  );
  const possible = criteria.reduce(
    (sum, criterion) =>
      sum + (criterion.status === "not_assessable" ? 0 : criterion.weight),
    0,
  );
  const totalWeight = assessmentRubric.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  const coverage = Math.round((possible / totalWeight) * 100);
  const traineeTurns = [...evidence.values()].filter(
    (turn) => turn.role === "user",
  ).length;
  const score =
    traineeTurns >= 3 && coverage >= 60
      ? Math.round((earned / possible) * 100)
      : null;

  return {
    rubricVersion,
    score,
    earned,
    possible,
    coverage,
    provisional: score === null || coverage < 100,
    criticalFindings: criteria
      .filter(
        (criterion) =>
          criterion.critical &&
          ["partial", "missed"].includes(criterion.status),
      )
      .map((criterion) => ({
        criterionId: criterion.id,
        title: criterion.label,
        reason: criterion.rationale,
        evidenceIds: criterion.evidenceIds,
      })),
    criteria,
  };
}
