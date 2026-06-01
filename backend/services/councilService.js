function computeWinner(voteOptions, votes) {
    const counts = Object.fromEntries(voteOptions.map((o) => [o.id, 0]));

    for (const v of votes) {
        counts[v.optionId] = (counts[v.optionId] ?? 0) + 1;
    }

    const sorted = [...voteOptions].sort((a, b) => counts[b.id] - counts[a.id]);
    const isTie = counts[sorted[0].id] === counts[sorted[1].id];

    if (isTie) {
        return voteOptions.find((o) => o.id === "B");
    }

    return sorted[0];
}

const DECISION_TEMPLATES = {
    "Full auth": {
        content: "The council has voted: full authentication from day one. Security cannot be deferred.",
        decisions: [
            { id: 1, text: "Full auth from day one" },
            { id: 2, text: "Core workflow first" },
            { id: 3, text: "Mock auth as internal test fallback" },
        ],
    },
    "Mock auth": {
        content: "Decision: use mock authentication for the MVP. Full auth is v2 scope.",
        decisions: [
            { id: 1, text: "Mock auth for MVP" },
            { id: 2, text: "Core workflow first" },
            { id: 3, text: "Full auth moved to v2" },
        ],
    },
};

function buildDecisionEvent(winner) {
    const template = DECISION_TEMPLATES[winner.label] ?? {
        content: `The council has decided: ${winner.label}.`,
        decisions: [{ id: 1, text: winner.label }],
    };

    return {
        id: 5,
        agentAbbr: "CEO",
        role: "Decision Leader",
        content: template.content,
        type: "decision",
        decisions: template.decisions,
    };
}

function buildCouncilWorkflow(idea) {
    const agentMessages = [
        {
            type: "agent_message",
            data: {
                id: 1,
                agentAbbr: "PM",
                role: "Product Manager",
                content: `Analyzing idea: "${idea}". The MVP should focus on onboarding, the core workflow, and basic account handling.`,
                type: "message",
            },
        },
        {
            type: "agent_message",
            data: {
                id: 2,
                agentAbbr: "CTO",
                role: "Technical Advisor",
                content: "I recommend mock authentication for the MVP. Full authentication would slow us down significantly.",
                type: "message",
            },
        },
        {
            type: "agent_message",
            data: {
                id: 3,
                agentAbbr: "DES",
                role: "Designer",
                content: "The user flow should be simple: start, complete the main action, confirm success.",
                type: "message",
            },
        },
        {
            type: "agent_message",
            data: {
                id: 4,
                agentAbbr: "QA",
                role: "Quality Analyst",
                content: "We need to handle empty states, failed actions, and unclear user input.",
                type: "message",
            },
        },
    ];

    const voteOptions = [
        { id: "A", label: "Full auth" },
        { id: "B", label: "Mock auth" },
    ];

    const votes = [
        { agentAbbr: "PM", agentName: "Product Manager", optionId: "B", reason: "Mock auth keeps the MVP scope lean." },
        { agentAbbr: "CTO", agentName: "Technical Advisor", optionId: "B", reason: "Full auth adds weeks of work. Ship first, secure later." },
        { agentAbbr: "DES", agentName: "Designer", optionId: "A", reason: "Real auth gives users a more trustworthy experience." },
        { agentAbbr: "QA", agentName: "Quality Analyst", optionId: "A", reason: "Real authentication reduces security and testing risks." },
    ];

    const winner = computeWinner(voteOptions, votes);

    return [
        ...agentMessages,
        {
            type: "conflict_detected",
            data: {
                id: 1,
                title: "Authentication scope",
                description: "PM wants account handling, CTO wants mock authentication for MVP speed.",
                resolution: "TBD — pending vote",
            },
        },
        {
            type: "vote_options",
            data: voteOptions,
        },
        ...votes.map((vote) => ({
            type: "vote",
            data: vote,
        })),
        {
            type: "decision",
            data: buildDecisionEvent(winner),
        },
        {
            type: "final_output",
            data: {
                prd: "MVP application based on a simple user flow and fast validation.",
                mvpScope: ["mock login", "core product action", "basic dashboard"],
                userFlow: ["enter idea", "start council", "review decisions", "export MVP plan"],
                architecture: ["Next.js frontend", "Express backend", "SSE realtime stream"],
                databaseSchema: ["projects", "council_sessions", "messages", "decisions", "outputs"],
                apiEndpoints: ["GET /", "GET /api/council/start?idea=..."],
                backlog: ["Frontend flow", "Backend workflow", "AI integration", "Database persistence", "Deploy"],
                implementationPlan: [
                    "Build mock workflow",
                    "Move workflow logic to backend",
                    "Connect Qwen API",
                    "Store sessions",
                    "Deploy demo",
                ],
            },
        },
    ];
}

module.exports = {
    buildCouncilWorkflow,
};