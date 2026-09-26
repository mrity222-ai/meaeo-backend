from __future__ import annotations

import json
from app.models.factory import ModelFactory
from app.models.response import ModelResponse


class ReviewResponderAgent:
    """
    AI Agent that creates localized, Local-SEO-optimized review responses
    incorporating business name, locality/city, and specific service keywords.
    """

    def __init__(self):
        self.llm = ModelFactory.get_provider()

    async def generate_reply(
        self,
        *,
        reviewer_name: str,
        star_rating: int,
        review_text: str | None,
        business_name: str,
        city: str,
        services: list[str] | None = None,
        tone: str = "warm, polite and professional",
    ) -> dict:
        services_str = ", ".join(services) if services else "our professional services"
        clean_name = reviewer_name or "Valued Customer"
        clean_text = review_text or "[Rating provided without text]"

        prompt = f"""You are an elite Local SEO expert and reputation manager for "{business_name}" located in {city}.
Your goal is to write a high-converting, empathetic, and Local SEO-optimized Google Business Profile review response.

### Business Details:
- Business Name: {business_name}
- Location / City: {city}
- Core Services: {services_str}
- Desired Tone: {tone}

### Customer Review:
- Reviewer Name: {clean_name}
- Star Rating: {star_rating} out of 5
- Review Content: "{clean_text}"

### Strict Response Rules:
1. Address the customer politely by name.
2. For 4-5 stars (Positive):
   - Sincerely thank them.
   - Weave in the exact Business Name ("{business_name}") and City ("{city}").
   - Mention the specific service/product or how we strive to deliver the finest {services_str} in {city}.
   - Invite them back warmly.
3. For 1-3 stars (Critical/Negative):
   - Apologize genuinely without being defensive.
   - Empathize with their specific experience.
   - Mention how seriously {business_name} takes quality service in {city}.
   - Invite them to reach out directly so management can resolve the issue immediately.
4. Local SEO Value: Natural keyword integration without keyword stuffing.
5. Length: 2 to 4 sentences. Natural, human, and conversational.
6. Output Format: You MUST output valid JSON only with keys:
   - "reply_text": (string) The full reply text.
   - "sentiment": (string: "positive", "neutral", or "negative")
   - "seo_keywords_used": (list of 2 to 4 strings of local keywords used)
"""

        messages = [
            {"role": "system", "content": "You are a professional reputation management and Local SEO specialist. Always output valid JSON only."},
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
                "reply_text": data.get("reply_text", text),
                "sentiment": data.get("sentiment", "positive" if star_rating >= 4 else "negative"),
                "seo_keywords_used": data.get("seo_keywords_used", [business_name, city]),
            }
        except Exception:
            fallback_reply = (
                f"Thank you so much {clean_name} for choosing {business_name}! We take pride in delivering top-tier {services_str} in {city}. We look forward to serving you again soon!"
                if star_rating >= 4
                else f"Dear {clean_name}, thank you for your feedback. At {business_name}, we take customer satisfaction in {city} very seriously. Please contact our management team directly so we can address your experience and make things right."
            )
            return {
                "reply_text": fallback_reply,
                "sentiment": "positive" if star_rating >= 4 else "negative",
                "seo_keywords_used": [business_name, city],
            }
