# Agent Society – AI Product Council

> Multi-agent AI system that simulates a real product team to transform an idea into a complete MVP plan using Qwen models on Alibaba Cloud.

## Overview

**Agent Society** is a multi-agent decision system where specialized AI agents collaborate to design a product MVP.

Instead of relying on a single LLM response, multiple AI agents assume different professional roles, discuss trade-offs, identify risks, resolve conflicts through voting, and produce a structured implementation plan.

The project was created for the **Qwen AI Hackathon** and demonstrates how multiple AI agents can cooperate to solve complex product planning tasks.

---

## Features

- Multi-agent workflow
- AI Product Council simulation
- Role-based reasoning
- Conflict detection and voting
- CEO arbitration
- Live conversation stream
- Automatic MVP package generation

Generated output includes:

- Product Requirements Document (PRD)
- MVP Scope
- User Flow
- Technical Architecture
- Database Schema
- API Endpoints
- Implementation Roadmap

---

## AI Agents

| Agent     | Responsibility                                 |
| --------- | ---------------------------------------------- |
| PM        | Defines product vision and MVP scope           |
| CTO       | Reviews technical feasibility and architecture |
| Designer  | Optimizes UX and user flows                    |
| QA & Risk | Identifies risks and edge cases                |
| CEO       | Resolves conflicts and makes final decisions   |
| Engineer  | Generates the final implementation package     |

---

## Workflow

1. User submits a product idea.
2. PM classifies the project.
3. Product agenda is generated.
4. Agents discuss each agenda item.
5. Conflicts are detected.
6. Agents vote on competing solutions.
7. CEO makes the final decision.
8. Engineer generates the complete MVP package.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- Server-Sent Events (SSE)

### AI

- Qwen API
- Alibaba Cloud DashScope
- OpenAI Compatible API

### Deployment

- Frontend (GH pages): https://amajewski1994.github.io/agent-forge/
- Backend: Alibaba Cloud ECS
- AI: Alibaba Cloud DashScope (Qwen API)

---

## Environment Variables

### Backend

```env
PORT=4000
HOST=0.0.0.0
FRONTEND_URL=https://amajewski1994.github.io
QWEN_API_KEY=YOUR_QWEN_API_KEY
QWEN_MODEL=qwen_model_name_ex._qwen-plus
QWEN_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

### Frontend

```env
NEXT_PUBLIC_BACKEND_URL=http://47.236.51.15:4000
```

---

## Running Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
npm install
npm run dev
```

---

## Alibaba Cloud Integration

The backend communicates with **Qwen** using Alibaba Cloud DashScope's OpenAI-compatible endpoint.

The implementation can be found in:

```text
backend/services/qwenService.js
```

---

## License

This project is released under the MIT License.

See the `LICENSE` file for details.
