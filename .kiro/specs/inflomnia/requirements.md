# Inflomnia Phase 1 MVP Requirements (AI for Media Track)

## Introduction

Inflomnia helps digital creators focus on creativity by automating repetitive audience management and providing data-backed pricing guidance. Instead of spending hours filtering spam and guessing brand deal rates, creators receive AI assistance for these high-friction, non-creative tasks.

## MVP Demo Scope (Feb 22 Prototype)

The Phase 1 MVP focuses on two core features that:
- Solve universal creator pain points
- Can be demonstrated live
- Are achievable within 12 days using AWS services

## Requirements

### Requirement 1: Comment Shield (Demo-Ready)

**User Story:** As a creator, I want Instagram spam and toxic comments automatically filtered so I can focus on meaningful audience interactions.

#### Acceptance Criteria

1. WHEN comments are received from the Instagram API, Amazon Bedrock Guardrails SHALL classify and flag spam/toxic content
2. WHEN filtering is complete, the AWS Amplify dashboard SHALL display a clear summary (e.g., "Filtered: 45 spam | High-value: 12 engagement")
3. WHEN creators approve or reject filtered comments, the system SHALL store feedback to improve future classification accuracy

*(Note: Accuracy benchmarks can be evaluated during demo without hard guarantees.)*

### Requirement 2: Brand Pricing Intelligence (Demo-Ready)

**User Story:** As a creator, I want fair pricing suggestions for brand partnerships so I can negotiate confidently without guesswork.

#### Acceptance Criteria

1. WHEN a creator inputs niche and follower count (e.g., "food blogger, 5K followers"), Amazon Bedrock Claude SHALL generate a recommended pricing range (e.g., ₹5K–₹8K)
2. WHEN pricing is generated, the system SHALL explain the reasoning in simple language (e.g., "Based on similar Indian creators with comparable engagement")
3. WHEN pricing data is requested repeatedly, AWS Lambda SHALL cache responses to enable fast dashboard retrieval

## Technical Foundation

- **AI Engine**: Amazon Bedrock (Claude 3.5 Sonnet) for reasoning and explanation
- **Frontend**: AWS Amplify for a responsive creator dashboard
- **Compute**: AWS Lambda for serverless execution and scalability
- **Security**: Amazon Bedrock Guardrails for content moderation and PII protection