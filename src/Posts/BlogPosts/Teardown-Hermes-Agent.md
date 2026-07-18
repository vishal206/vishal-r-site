---
title: "Teardown: Hermes Agent"
date: "14 July 2026"
isTech: true
isContextTable: true
tags: "Devlog"
image: "/assets/hermes-agent.png"
---

**Hermes** is an open-source, self-hostable AI agent: a personal, always-available assistant that you run and own instead of renting from a closed platform. You can talk to it from a terminal, a desktop app, an API, or messaging platforms such as Telegram, Slack, WhatsApp, and email. It keeps durable memories, can search earlier conversations, learns reusable procedures as skills, and can run scheduled jobs such as a daily briefing without waiting for you to send the first message.

> Think of it as an early, practical version of Jarvis, without the flying suit.

The basic loop is straightforward: send context and tools to a model, execute any tool calls it returns, feed the results back, and repeat.

The difficult part is everything required to make that loop reliable for months: session isolation, prompt caching, memory boundaries, interrupts, permissions, provider differences, background work, scheduling, and dozens of user interfaces that all have to behave like the same assistant. That reliability is what set Hermes apart from the usual agent demo.

**This article starts with the loop, then goes module by module through everything wrapped around it."**

# Bird's view

<img src="/assets/bird_view.svg" alt="Bird's View" />

> At the highest level, Hermes sits between you, an AI model, your data, and the outside world.

You can talk to it from a terminal, the desktop app, an API, or a messaging app (a gateway). A message sent from Telegram and a question typed in the terminal eventually reach the same central system.

When Hermes receives a message, it first finds the correct conversation. It then gathers a small briefing pack for the AI model: your recent messages, useful long-term memories, preferences, project instructions, and any relevant skills. This is what lets a conversation continue instead of starting from zero every time.

Hermes then asks the chosen AI model what to do. Sometimes the model can answer immediately. Other times it asks Hermes to use a tool: search the web, read a file, run a command, control a browser, or send a message. Hermes performs that action, gives the result back to the model, and repeats until the task is complete.

Finally, Hermes saves the conversation in a **SQLite database** and returns the result through the same place you contacted it.

Scheduled tasks follow the same path, except a timer starts the work instead of a new message from you.

Hermes chooses what context and tools the model receives, calls the selected model, executes approved actions, records the results, enforces limits, saves state, and routes the final reply. You can switch the underlying model while the rest of Hermes keeps working the same way.

# Detailed view

Before looking at individual modules, it helps to follow one turn from beginning to end.

<img src="/assets/detailed-view.png" alt="Detailed Flow" />

For a terminal session, the entry adapter is the CLI or TUI gateway. For a Telegram session, it's the Telegram adapter plus GatewayRunner. The middle of the sequence stays essentially the same.

That shared middle is the architectural win: new surfaces don't need to reimplement reasoning, tools, memory, or provider logic.

## 1. Gateway

> The gateway handles messaging apps. It accepts messages written in many platform-specific formats, checks who sent them, and passes each one to the correct Hermes conversation. It combines platform adapters, session routing, authorization, and delivery behind one shared messaging layer.

An adapter converts a platform-specific event into a common message format plus a description of where it came from. From there, the gateway does four things.

### Authorization

Messaging an internet-facing bot isn't the same as typing into a local shell, so the gateway decides whether the sender is even allowed to use the assistant. It checks platform allow-lists, pairing state, role-based authorization, and relay trust before a message can start an agent run.

### Session routing

Every person, chat, and thread needs to open the correct conversation instead of somebody else's. The gateway creates a deterministic routing key for each conversation. A typical default-profile direct-message key looks like this:

`agent:main:telegram:dm:<chat-id>`

Group, thread, participant-isolation, and named-profile settings add or change segments. Centralizing this logic stops two users, threads, or profiles from accidentally sharing history.

### Concurrency and interruption

A user can send another message while the agent is still calling a model or running a tool. The gateway tracks active sessions, queues follow-ups, lets control commands like /stop bypass the normal queue, and signals the running agent to interrupt when needed. This is a surprisingly important difference between a demo bot and an assistant people can actually rely on.

### Delivery

The gateway sends final text, streamed updates, media, approval prompts, and scheduled-job results back through the correct adapter, so the answer reaches whoever should get it. Keeping delivery separate from reasoning is also what makes cross-platform delivery possible.

> The gateway wraps the agent. It doesn't contain it.

## 2. Agent core

> The agent core gives the AI model the right information, carries out whatever actions it requests, feeds the results back, and keeps going until there's an answer.

It runs on a shared agent runtime. Turn setup and the main conversation loop are separated internally, but they share the same agent state, budgets, callbacks, tools, and persistence lifecycle. The conceptual loop is small enough to write as pseudocode:

```
messages = history + [user_message]

while iteration_budget_remains():
    response = provider.call(
        system_prompt=system_prompt,
        messages=messages,
        tools=tool_schemas,
    )

    if response.tool_calls:
        messages.append(response.as_assistant_message())
        results = execute_tools(response.tool_calls)
        messages.extend(results)
        continue

    return response.text
```

That's the easy part. Hermes layers several production constraints around it: a unified message format, valid role ordering, interruptible model and tool calls, safe parallel tool execution, bounded agent iterations, retries and provider fallback, repetition guardrails, real-time progress updates, and crash-safe message persistence.

The loop itself is just an algorithm. What makes it usable in production is everything wrapped around it.

### 3. Prompt and context assembly

Before asking the AI model for anything, Hermes puts together everything the model needs: rules, memories, conversation, project details.

An agent is largely defined by the context it sends to the model, and Hermes assembles its system prompt from several ordered sources, each with a different purpose and expected lifetime. The prompt has three broad tiers:

- **Stable guidance:** agent identity, tool-use rules, skills index, environment hints, model-specific guidance, platform guidance.
- **Conversation context:** an optional caller system message plus project-specific instruction files.
- **Session snapshot:** bounded local memory, the user profile, an external-memory provider block, and session/model/date metadata.

The labels describe how often the inputs are expected to change, but the joined system prompt is treated as one frozen snapshot for the conversation. A memory write updates disk immediately, but it doesn't rewrite the system message halfway through a session. The refreshed value shows up at a new session, or at an explicit rebuild boundary like context compression.

Turn-scoped data follows a different path. Plugin-provided context and dynamic recall from an external memory provider get attached to the current user turn instead of mutating the cached system prompt.

<img src="/assets/prompt_and_context.svg" alt="Prompt and context assembly" />

This protects prompt caching, one of Hermes's most important cost controls. Long-running conversations repeatedly send a large common prefix. If the system prompt or earlier history changes unnecessarily on every turn, the provider can't reuse its cached prefix, and the same conversation gets slower and more expensive.

So Hermes sticks to frozen snapshots, append-only turn history, and explicit compression boundaries instead of mutating the prompt live.

**Context compression**

Even a well-cached conversation eventually runs into the model's context window. When that happens, the default compressor keeps the beginning and a recent tail, removes or truncates stale tool output, summarizes the middle, and keeps tool-call/result groups valid. Compression can create session lineage, so the continuation stays connected to its parent session.

The compression strategy is swappable through a plugin interface, so you can change how context gets managed without rewriting the agent loop.

### 4. Provider layer

The provider layer lets Hermes talk to different AI services without rebuilding the rest of the assistant for each one.

Hermes supports several wire protocols, including OpenAI-compatible Chat Completions, OpenAI/Codex Responses, native Anthropic Messages, Bedrock Converse, and an optional Codex app-server runtime. Adapters translate these into and out of the agent's common internal message format. This separation solves two problems.

First, the same CLI, gateway, cron job, and ACP session can switch providers without changing their own code. Second, provider-specific behavior (authentication refresh, reasoning blocks, cache markers, response parsing, model-specific fields) stays contained instead of leaking across the whole application.

Hermes also routes auxiliary tasks separately. Vision preprocessing, compression summaries, memory review, and other side jobs can run on a cheaper or better-suited model than the main conversation.

This isn't just about avoiding vendor lock-in. It keeps protocol differences from bleeding into the agent loop.

### 5. Tools

Tools let Hermes actually do things: read files, search the web, run commands, instead of just talking about them.

Before a turn starts, Hermes resolves enabled and disabled toolsets, checks availability gates, adds plugin and MCP tools, and sends the resulting schemas to the model. A tool that needs an unconfigured service just disappears from the schema instead of showing up and failing every time it's called.

### 6. Persistence and memory

The word "memory" hides several unrelated mechanisms, and Hermes keeps them separate instead of lumping them into one store:

| Mechanism                    | Main store                                  | Purpose                                                                       |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Conversation transcript      | state.db                                    | Exact user, assistant, reasoning, and tool messages                           |
| Session routing and metadata | state.db                                    | Maps platforms/threads/profiles to sessions; tracks usage, lineage, and state |
| Session recall               | SQLite FTS indexes                          | Finds relevant text across earlier conversations                              |
| Durable local memory         | MEMORY.md                                   | Compact facts, environment knowledge, and lasting lessons                     |
| User profile                 | USER.md                                     | Preferences, identity, and communication style                                |
| Project context              | .hermes.md, AGENTS.md, and compatible files | Repository-specific rules and facts                                           |
| Procedural memory            | SKILL.md                                    | Reusable workflows and supporting resources                                   |
| External memory              | Active memory-provider plugin               | Semantic recall, user modeling, or remote memory systems                      |
| Scheduled work               | jobs.json                                   | Job definitions and next-run state                                            |

This separation is both cheaper and more accurate. The model gets a small set of durable facts on every new session, can search the larger transcript when it needs to, and only loads a detailed procedure when the task actually matches it.

### 7. Delegation

Delegation lets Hermes split a large job into smaller pieces, hand them to helper agents, and bring the results back together.

It's implemented as an agent-level tool rather than a separate orchestration product. A parent can launch child agents with isolated context for parallel or specialized work. At the top level, delegated tasks can run in the background and report completion back into the originating session. Nested orchestrator agents can wait for their workers when they need the results to compose an answer.

The useful pattern here isn't "ask several models the same question." It's decomposition: give each child a bounded goal and only the context it needs, let independent work happen in parallel, keep tool and iteration limits explicit, and return structured results to one owner that pulls them together.

Because child agents reuse the same agent runtime, they inherit the same provider, tool, safety, and persistence machinery instead of needing a second execution architecture.

## What makes Hermes more than a toy agent?

> A toy agent can work once, in a perfect demo. A dependable agent has to keep working safely when conversations grow, services fail, users interrupt, or several things happen at once.

Strip away the interfaces and production safeguards, and Hermes reduces to the same loop you'll find in most agent tutorials. Its maturity comes from the decisions built around that loop:

- **cache stability** (don't mutate the conversation prefix casually)
- **message correctness** (preserve strict user/assistant/tool relationships)
- **state separation** (transcripts, memories, instructions, skills, and schedules are different things)
- **platform isolation** (every chat, thread, user, and profile has to map to the correct session)
- **interruptibility** (users need to redirect or stop work that's already running)
- **capability gating** (unavailable services shouldn't show up as callable tools)
- **safety boundaries** (approvals and scope checks around powerful side effects)
- **edge extensibility** (providers, platforms, tools, memory, and context strategies can grow without bloating the core)
- **failure recovery** (persistence, retries, fallbacks, locks, and idempotent delivery, which all matter when a process runs for months).

That's also the answer to my earlier question. **Almost anyone will be able to assemble a basic agent now. The center is turning into a commodity, the same way wiring an HTTP request did.**

But building an agent people actually trust is still systems engineering. It's not the while loop that matters. It's the quality of the context, tools, permissions, recovery paths, interfaces, and learned procedures around it, and the discipline to keep those pieces understandable as the product grows.
