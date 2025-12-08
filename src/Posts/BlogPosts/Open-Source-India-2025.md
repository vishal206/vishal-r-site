---
title: "Open Source India 2025"
date: "07 Dec 2025"
image: "https://github.com/vishal206/personal-site-images/blob/main/osi-cover.png?raw=true"
banner: "https://github.com/vishal206/personal-site-images/blob/main/osi-cover.png?raw=true"
tags: "Tech"
---

Konnichiwa Readers!

Last month, I attended an event I found through my regular magazine, **Open Source For You**.  
If you like holding a physical magazine that talks about tech, especially the soft side of tech changes, I recommend this one.  
_Also because I don’t think we have another option in India._

Coming to the event, the venue had three halls:  
Hall A for FOSS talks, Hall B dedicated to DevOps, and Hall C for all things AI.  
As someone who’s been craving to build a good, meaningful AI-powered product, I knew exactly where I was sitting: Hall C. And yes, I stayed there the whole time.

Thankfully, I had the Essential Pass, so the conference videos will soon land in my inbox too.

I tried to create this as a multi-paged notebook, where I go in detail on the topics I explored.  
But for 1 month I tried and couldn’t pull it off.  
So I decided to give up on it and write a brief while I still have the emotions of the event.

### About the Event

Open Source India (OSI) is basically a yearly snapshot of how open source is evolving across AI, DevOps, cloud, data systems, security, and enterprise adoption.  
It’s a mix of companies showcasing what they’re building and engineers sharing the _behind-the-scenes_ of how large systems actually run.

I’ve listed below some of my takeaways from my almost 20-page handwritten notes.  
Hopefully, you encounter a few new terms to Google later.

# 1. The Business of Open Source @ Google

**Speaker:** _Guru Bala, Customer Engineering Manager, Google Cloud_

I entered this one late and the first slide I saw was **AI Agent Evolution**.  
A reminder, this wasn’t about “AI evolution”, otherwise we’d travel back to Alan Turing in the 1950s, but about how _AI agents_ are evolving.

### From Prompts to an Agent Systems

We’ve moved from simple prompt-response systems to collaborating multi-agent setups (MAS).

<img src="https://github.com/vishal206/personal-site-images/blob/main/ai_evolution_flow_2.jpg?raw=true" alt="ai agent evolution flow" />

_A multi-agent system (MAS) consists of multiple artificial intelligence (AI) agents working collectively to perform tasks on behalf of a user or another system._

Reality check: the ecosystem today is pretty fragmented.

**Agent challenges:**

- Hard integrations
- No unified frameworks
- Lack of open-source governance
- Developers reinventing state management & workflows

A key consideration in agent development is the framework. Without it, developers would be compelled to build everything from scratch, including state management, tool handling, and workflow orchestration. This often results in systems that are complex, difficult to debug, insecure, and ultimately unscalable.

The Linux Foundation recently noted that agent frameworks lack licensing clarity compared to normal OSS, and the talk echoed that.

## Agent-to-Agent Protocol (A2A)

Google introduced **A2A**, a protocol that lets agents:

- Discover each other
- Negotiate
- Share state
- Collaborate securely

### A2A vs MCP

A2A is a protocol for connecting agents, where the MCP is a standard for connecting AI applications to external systems, tools, data sources, etc..

Clearly, A2A isn’t trying to compete with MCP; contradictingly, it is an open protocol that complements MCP.

## Agent Payment Protocol (AP2)

As agents begin to make transactions on behalf of users, Google introduced **AP2**, which enforces:

- Authentication
- Authorization
- Accountability

AP2 is a newly launched open protocol from Google to securely initiate and transact agent-led payments across platforms. This can be used as an extension of the A2A and MCP. AP2 is an open, shared protocol that provides a common language for secure, compliant transactions between agents and merchants, helping to prevent a fragmented ecosystem.

Examples from the session:

- Agents standing in queue
- Tracking prices
- Repetitive billing
- Handling loyalty programs

The speaker also recommended **Gen AI Academy 2.0** for deeper learning.

In the end, a course was recommended- Gen AI Academy 2.0 - https://vision.hack2skill.com/event/genaiacademy2

References:

https://www.ibm.com/think/topics/multiagent-system
https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
https://modelcontextprotocol.io/docs/getting-started/intro

# 2. Ingest Anything, Unify Everything

**Apache NiFi + LLMs + Apache Iceberg**  
**Speaker:** _Kamesh Sampath, Lead Developer Advocate, Snowflake_

This talk explored what happens when LLMs meet enterprise data, especially around **security** and ingestion.

### NiFi → Datavolo → Snowflake OpenFlow

The story goes like this: there was Apache NiFi, an open-source data-flow tool, and Datavolo, a company started by NiFi’s original creators, building yet another data-flow platform on top of the same engine. Snowflake later acquired Datavolo to fill its ingestion and data-integration gap and bring native pipelines into the Snowflake Data Cloud.

After this acquisition, Snowflake launched **OpenFlow**, a managed version with:

- Governance
- Higher security
- Observability
- Deployment flexibility

## Handling Schema Drift

Real-world ingestion alays means inconsistent formats and column names.

OpenFlow + Iceberg + Avro + LLMs helps adapt to changing schemas automatically.

Avro is helpful here because of its structured schema evolution and compatibility checks.

## AI_Complete in SQL

Snowflake’s **AI_Complete** lets you embed prompts directly inside SQL queries.  
They also spoke about **Snowflake Intelligence** and **Cortex Search**, which bring natural language search over structured + unstructured data.

A funny note I had written:  
“LLMs understand Markdown now, suddenly important.”

# 3. Managing Risk in Generative AI Code

**Speaker:** _Laxmiswarupa Dhal, Siemens Technology_

This talk focused on a less glamorous but essential topic: legal and security responsibilities in AI adoption.

### Key Takeaways

- Use **SCA tools** to identify OSS vulnerabilities
- Use **Linters** for AI-generated code sanity checks
- Maintain **SBOM** for traceability
- Handle open-source licenses correctly
- Respect **GDPR** when dealing with personal data

# 4. NeuroFlow – AI Agents for Software Discovery & Governance

**Speaker:** _Anil Menakath, Autodesk India_

Modern enterprises struggle with a surprising problem:

- Employees don’t know which tools exist
- Access requests take days
- Unused licenses waste money
- Teams lack visibility into ROI

### What NeuroFlow Does

NeuroFlow uses an agentic, MCP-based architecture integrating:

- Software discovery
- Access workflows
- License governance
- Telemetry pipelines
- Usage analytics

It’s built using LangGraph and open-source frameworks.  
Not a commercial product (yet), but feels like the direction enterprise tool management is heading.

# 5. AI Inference That Doesn’t Run Out of Memory

**Speakers:** _Akash Bisht & Jayapaul Paul, Pure Storage_

If you love understanding LLM internals, this one was a treat.

<img src="https://re-cinq.com/blog-img/llm-architecture-img-1.png" alt="ai agent evolution flow" />

This session went into how LLMs actually run under the hood. They started with the basics — the transformer model from “Attention Is All You Need” — and explained three important terms: **multi-head attention** (MHA), **inference latency**, and the **KV Cache**.

MHA helps the model look at different parts of a sentence at the same time.
Inference latency is simply the time taken to produce output after receiving input.

Then comes the KV Cache, which stores the Key (K) and Value (V) vectors generated at each layer for every token. This cache avoids recomputing past tokens again and again, but it comes with its own problems:

- It stores everything, even unnecessary context → wasting GPU memory & bandwidth
- It grows linearly with every token → GPU memory eventually fills
- The model can’t predict output length → memory fragmentation, allocation issues
- Cache can’t be reused across sessions → each new request rebuilds everything from scratch

Because of this, the model ends up re-reading prompts, re-running attention on all layers, and rebuilding the KV cache every single time. That’s a lot of wasted work.

## Pure KVA

The Pure Storage team asked a simple question:
“Why throw away the KV cache after every call?”

So they built Pure KVA, which:

- Captures and compresses KV Cache
- Stores it externally (NFS or S3)
- Reuses it when the same prompt/context appears again

This means repeated queries, multi-turn chats, and RAG workflows don’t need to recompute attention from scratch.

Their benchmarks showed:

- 20× faster inference using NFS-backed KV caching
- 6× faster with S3-backed caching

Since GPUs skip redundant work, throughput increases and operational cost drops — and high-performance storage like Pure FlashBlade gives low-latency access even under load.

Reference & Recommended Read:
https://blog.purestorage.com/purely-technical/20x-faster-inference-first-kv-cache-for-s3-and-nfs/

# 6. Managing High-Performing Systems – NPCI

**Speaker:** _Janardanan Krishnamurthy, NPCI_

I don’t remember every technical detail from this talk, but the speaker’s storytelling really stood out.  
He walked us through how their system evolves as their users grow — and it genuinely felt like watching a documentary.

First, a quick intro: **Bharat Connect** is India’s bill-payment infrastructure. It lets people pay for electricity, water, gas, FASTag, and more through a single, trusted network.

### How the system grows

The story was structured around three parts that continuously evolve:

- **Application Stack** – all the technologies powering the system
- **Value Additions** – features added as the system matures
- **Observability Stack** – everything that helps them “see” the system

### **Initial Stage**

**Application stack:**

- Spring Boot
- JSP
- PostgreSQL

**Observability:**

- Logs + records
- Third-party agents

This was the early, simpler version.

### **At 500 TPS (Transactions Per Second)**

This is where complexity begins. They added:

- **Redis** – to cache frequently used data, reduce load on Postgres, and remove read bottlenecks
- **Kafka** – to handle traffic spikes, process events asynchronously, and buffer high-volume bill-payment events

At this stage, they also added **Analytics** and **Availability** improvements to comfortably reach **2500 TPS**.

### **At 12K TPS**

Some services were failing under load, so they introduced **fault tolerance** — ensuring the system keeps working even if individual components fail.

On the observability side, they expanded beyond logs to include **metrics and monitoring agents**, making debugging and performance tracking easier.

### **At 1 Billion+ Transactions**

Postgres couldn’t scale linearly with that volume, so they brought in **Cassandra**.

Cassandra is built for:

- Massive write throughput
- Horizontal scaling
- Zero downtime
- Multi-datacenter replication

Perfect for a bill-payment system where every transaction is a write and availability is non-negotiable.

### **What’s Next?**

The upcoming improvements he hinted at were:

- **OpenTelemetry** – a unified way to collect logs, metrics, and traces across services
- **Consolidated Views** – one dashboard to see the entire system’s health
- **Long-Term Aggregation** – compressing and summarizing huge datasets for long-term storage

And on top of this, a new AI/ML layer will bring:

- Predictive analytics
- Knowledge democratization
- Productivity improvements

This talk was less about individual technologies and more about how a national-scale system grows, adapts, and hardens over time — and that’s what made it memorable.

# 8. API-Led Connectivity with Open-Source Gateways

This session focused on **API-led connectivity**, which is basically a structured way of connecting systems using purposeful, reusable APIs instead of point-to-point integrations. If you’ve ever worked in a system where every app talks to every other app directly, you’ll know how quickly that turns into spaghetti, hard to maintain, impossible to scale.

API-led connectivity solves this by treating APIs as modular building blocks of the organisation.  
Each API has a clear job, a clear boundary, and a clear consumer.  
This makes the whole system easier to govern, secure, and reuse.

The idea comes from MuleSoft’s architectural approach (now part of Salesforce), and the more I read about it, the more I understood why large organisations lean towards this pattern.

### Why API-led connectivity matters

Instead of teams building one-off integrations for each new requirement, API-led connectivity encourages creating a **layered architecture**, where APIs are designed once and reused across channels, use cases, and applications.

This brings a few benefits:

- Reduced duplication (no team re-implements what already exists)
- Better security and governance (centralized control instead of scattered logic)
- Faster delivery (new apps assemble APIs like Lego blocks)
- Consistency across channels (web, mobile, partner systems all use the same underlying APIs)

It’s basically the “composable enterprise” mindset.

### The Three-Layer API Architecture

The model is broken into **three API layers**, each serving a very different purpose.

#### **1. System APIs – The Data Access Layer**

These connect directly to systems of record: databases, ERPs, CRMs, legacy systems, 3rd-party platforms, etc.

**Their job:** unlock core data safely.  
**Think of them as:** the _nouns_ of the business — Customer, Order, Product.

System APIs don’t apply business logic. They simply expose underlying data in a clean, consistent, secure manner.

#### **2. Process APIs – The Orchestration Layer**

Process APIs sit above System APIs and combine, transform, or orchestrate data from multiple sources.

**Their job:** implement business logic and processes.  
**Think of them as:** the _verbs_ — VerifyOrder, GenerateInvoice, UpdateSubscription.

Instead of repeating these workflows in every app, you implement them once here.  
They also protect the core systems by controlling how data flows in/out.

#### **3. Experience APIs – The Delivery Layer**

These are tailored for specific channels: mobile apps, dashboards, partner portals, web apps, etc.

**Their job:** shape data for the specific experience or user interface.  
**Think of them as:** the _views_ — optimized for each screen or channel.

For example:

- A mobile app might need concise, lightweight data
- A dashboard may need aggregated statistics
- A partner portal might need limited but high-level information

Experience APIs reuse Process + System APIs underneath but format the output for the target audience.

### How this avoids the "integration spaghetti"

Without API-led connectivity, every new app or channel typically builds direct integrations into the source systems. Over time, this turns into:

- tightly coupled systems
- duplicated logic
- inconsistent data
- hard-to-track dependencies

With API-led connectivity:

- System APIs stabilize access to core data
- Process APIs handle the logic once
- Experience APIs adapt the output for consumers

Everything becomes more maintainable. And if a system changes (e.g., database migration), only the System API needs updating, not every app.

### Where open-source gateways fit in

The session tied this architecture back to **open-source API gateways**, which handle:

- authentication & authorization
- traffic control
- monitoring & observability
- routing between API layers
- policy enforcement

Gateways like **Kong**, **WSO2**, **Envoy**, and others allow teams to build this MuleSoft-style architecture without vendor lock-in.

Because once you structure your APIs in layers, you need a consistent way to route, secure, and manage them — that’s where gateways shine.

### A recommended read

If you’re curious, the blog that inspired this section is worth going through:  
https://www.salesforce.com/in/blog/api-led-connectivity/

It explains the layered API model beautifully, and honestly, it made me appreciate why enterprise-scale systems lean heavily on this pattern.

# Final Thoughts

Overall, this year’s OSI felt less like a conference and more like a roadmap of where open-source and AI might be heading.  
From agent protocols and hybrid RAG to KV cache engineering and billion-scale systems, almost every talk pointed toward a future where:

- Systems are more autonomous
- Pipelines are more intelligent
- Observability becomes predictive
- Enterprise software begins “managing itself”

These were my key takeaways, and probably topics I’ll dive into more as the year goes on.
