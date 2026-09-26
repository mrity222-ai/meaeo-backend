from __future__ import annotations

import json
from app.models.factory import ModelFactory
from app.models.response import ModelResponse


class GoogleBusinessOfferAgent:
    """
    AI Agent that generates compelling daily promotional offers and updates
    tailored for Google Business Profile Local Posts.
    """

    def __init__(self):
        self.llm = ModelFactory.get_provider()

    async def generate_offer(
        self,
        *,
        business_name: str,
        industry: str,
        city: str,
        theme: str | None = None,
        discount_target: str | None = None,
    ) -> dict:
        theme_str = theme or "Exclusive Limited-Time Offer"
        discount_str = discount_target or "special discount / value-add"

        prompt = f"""You are an expert Google Business Profile growth marketer for "{business_name}" ({industry}) in {city}.
Create an irresistible, high-converting Google Business Profile Promotional Offer post.

### Inputs:
- Business: {business_name}
- Industry: {industry}
- City: {city}
- Promotion Theme: {theme_str}
- Offer Target: {discount_str}

### Rules for GBP Local Offers:
1. "offer_title": Catchy, short headline (max 58 characters). Example: "Flash Sale: Flat 20% Off in {city}!"
2. "summary": Engaging GBP post copy (150-300 words). Include local context, benefits, clear call to action, and relevant hashtags.
3. "coupon_code": Short memorable code (e.g. SAVE20, FESTIVE15, FLASH50).
4. "call_to_action_type": Choose one among: "ORDER", "BOOK", "CALL", "LEARN_MORE", "SIGN_UP".
5. "terms_conditions": Simple 1-sentence terms (e.g., "Valid until month end. Cannot be combined with other offers.").

Output valid JSON only with keys:
- "offer_title"
- "summary"
- "coupon_code"
- "call_to_action_type"
- "terms_conditions"
"""

        messages = [
            {"role": "system", "content": "You are a local marketing copywriter. Always output valid JSON only."},
            {"role": "user", "content": prompt},
        ]

        try:
            import asyncio
            if hasattr(self.llm, "ainvoke"):
                raw_res = await asyncio.wait_for(self.llm.ainvoke(messages), timeout=12.0)
            else:
                raw_res = self.llm.invoke(messages)
            text = ModelResponse.content(raw_res).strip()

            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
            return {
                "offer_title": data.get("offer_title", f"Special Deal from {business_name}"),
                "summary": data.get("summary", f"Visit {business_name} in {city} for special savings today!"),
                "coupon_code": data.get("coupon_code", "SPECIAL10"),
                "call_to_action_type": data.get("call_to_action_type", "LEARN_MORE"),
                "terms_conditions": data.get("terms_conditions", "Terms and conditions apply."),
            }
        except Exception:
            return {
                "offer_title": f"Exclusive Offer from {business_name} in {city}",
                "summary": f"Looking for top-notch {industry} in {city}? Claim your exclusive offer with {business_name} today! Contact us or visit our profile to get started.",
                "coupon_code": "LOCALPROMO",
                "call_to_action_type": "LEARN_MORE",
                "terms_conditions": "Valid for a limited time only.",
            }
