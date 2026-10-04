### **Project Implementation Prompt: Monetization & Credit System Integration**

**Context:**
I have already developed a fully functional AI-powered SaaS application that automates the generation and scheduling of social media. The core features and API integrations are complete. I now need to implement the payment system, wallet logic, and credit deduction mechanics into the existing application.

#### **1. Core Business Model (Pay-As-You-Go)**

* **System Type:** Wallet Top-up Model (Credits have NO expiry date).
* **Base Currency Value:** 1 Credit = $0.015 USD.

#### **2. Credit Deduction Logic (Feature Pricing)**

The system must deduct specific credits for each user action. Implement the following deduction rules in the backend:

* **Caption & Hashtags Generation:** 1 Credit (cost to user: $0.015)
* **Standard Voiceover (Gemini TTS / Fish Audio):** 2 Credits (cost to user: $0.030)
* **Premium Voiceover (ElevenLabs):** 4 Credits (cost to user: $0.060)
* **Social Media Scheduling (Meta API):** 1 Credit (cost to user: $0.015)
* **FULL 1-CLICK AUTOMATION (Idea -> Caption -> Voice -> Schedule):** 5 Credits (cost to user: $0.075)

#### **3. User Packages & Tiers**

Configure the following Top-up plans in the database and payment gateway:

**A. Free Tier (On Sign-up)**

* **Welcome Bonus:** 50 Free Credits automatically assigned upon registration.
* **Capability:** Enough for 10 full automated reels.
* **Limits:** Restricted to standard voices and standard scheduling.

**B. Starter Top-up ($10)**

* **Price:** $10 USD.
* **Credits Allocated:** 700 Credits.
* **Capability:** Enough for 140 full automated reels.
* **Features Unlocked:** Ability to link up to 3 Meta (Facebook/Instagram) accounts.

**C. Pro Top-up ($30)**

* **Price:** $30 USD.
* **Credits Allocated:** 2,200 Credits (includes volume bonus).
* **Capability:** Enough for 440 full automated reels.
* **Features Unlocked:** Premium voices (ElevenLabs), up to 10 Meta accounts, bulk scheduling, and priority rendering.

#### **4. API Usage & Cost Optimization (Reference for Backend Execution)**

The current system already utilizes the following APIs. Ensure the credit deductions align with these backend executions to maintain the target net profit margin (~75%):

* **Text Generation:** Gemini 3.5 Flash-Lite / OpenRouter (Llama 3 8B).
* **Standard Voiceover:** Gemini 3.8 Flash TTS / Fish Audio.
* **Premium Voiceover:** ElevenLabs (Triggered only if user has sufficient premium credits).
* **Scheduling:** Meta Graph API (100% Free).

#### **5. Developer Implementation Tasks:**

1. **Database Update:** Update the existing `users` table to include an `available_credits` (integer/float) column.
2. **Ledger System:** Create a `transactions` or `credit_history` table to log every credit deduction (e.g., action type, credits deducted, timestamp) for user transparency.
3. **Payment Webhooks:** Integrate Stripe/PayPal webhooks. On a successful $10 charge, increment `available_credits` by 700. On a $30 charge, increment by 2,200.
4. **Execution Middleware:** Implement a strict balance check before any API call is triggered. If `available_credits` is less than the required amount for the requested action, abort the process, return an "Insufficient Credits" error, and prompt the user to top up their wallet.

---
