from __future__ import annotations

import json
from app.models.factory import ModelFactory
from app.models.response import ModelResponse


class GoogleBusinessSeoOptimizerAgent:
    """
    AI Agent that analyzes and optimizes Google Business Profile descriptions,
    services, and local search keywords to maximize Google Maps 3-Pack rankings.
    """

    def __init__(self):
        self.llm = ModelFactory.get_provider()

    async def optimize(
        self,
        *,
        business_name: str,
        industry: str,
        city: str,
        current_description: str | None = None,
        current_services: list[str] | None = None,
    ) -> dict:
        cur_desc = current_description or "None provided"
        services_str = ", ".join(current_services) if current_services else "Standard industry services"

        prompt = f"""You are a world-class Google Business Profile (GBP) Local SEO Specialist.
Your task is to produce a 100% complete, high-ranking Local SEO optimization package for:
- Business Name: {business_name}
- Primary Category / Industry: {industry}
- Primary City / Target Location: {city}
- Current Description: {cur_desc}
- Current Services: {services_str}

### Rules for Local SEO Optimization:
1. "optimized_description":
   - STRICTLY between 500 and 740 characters (Google's limit is 750 characters).
   - Place high-search-intent primary keywords and city name within the FIRST 250 characters.
   - Highlight years of experience, unique selling propositions (USPs), licensed/certified, customer satisfaction.
   - Include a clear call-to-action (Call today / Visit us in {city}).
   - NO URLs or promotional all-caps words (Google guideline compliance).
2. "target_keywords":
   - Provide 8-12 high-intent search terms real customers search on Google Maps (e.g. "best {industry} in {city}", "top rated {industry} near me", "{industry} service {city}").
3. "recommended_services":
   - List of 4-6 specific sub-services with optimized names and 1-sentence descriptions that can be added to the GBP Services menu.
4. "profile_completeness_score":
   - Integer between 70 and 95 evaluating local optimization potential.
5. "seo_checklist":
   - List of 4 actionable recommendations for maintaining top rank in {city} (e.g. photo count, weekly updates, review velocity, opening hours).

Output valid JSON only with keys:
- "optimized_description": (string)
- "target_keywords": (list of strings)
- "recommended_services": (list of objects with "name" and "description")
- "profile_completeness_score": (int)
- "seo_checklist": (list of objects with "item" and "importance")
"""

        messages = [
            {"role": "system", "content": "You are a Local SEO specialist. Always output valid JSON only."},
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
                "business_name": business_name,
                "city": city,
                "optimized_description": data.get("optimized_description", f"Welcome to {business_name}, your premier {industry} in {city}. We deliver quality services tailored to your needs. Contact us today!"),
                "target_keywords": data.get("target_keywords", [f"{industry} in {city}", f"best {industry} {city}", f"{business_name} {city}"]),
                "recommended_services": data.get("recommended_services", [
                    {"name": f"Comprehensive {industry}", "description": f"Professional {industry} solutions in {city}."},
                    {"name": f"Express Consultation", "description": f"Dedicated on-demand consultation in {city}."}
                ]),
                "profile_completeness_score": data.get("profile_completeness_score", 85),
                "seo_checklist": data.get("seo_checklist", [
                    {"item": "Upload at least 5 high-resolution store/work photos every month", "importance": "High"},
                    {"item": "Reply to all customer reviews within 24 hours using local keywords", "importance": "Critical"},
                    {"item": "Post weekly promotional updates or special offers", "importance": "High"},
                    {"item": "Verify accurate business operating hours and phone number", "importance": "Critical"}
                ]),
            }
        except Exception:
            return {
                "business_name": business_name,
                "city": city,
                "optimized_description": f"Welcome to {business_name}, the trusted choice for {industry} in {city}. We provide reliable, top-quality services backed by exceptional customer care. Whether you are looking for expert consultation or full-service solutions in {city}, our experienced team is here to assist you. Call us or visit our location today to experience why locals recommend {business_name}!",
                "target_keywords": [f"best {industry} in {city}", f"{industry} near me", f"top rated {industry} {city}", f"{business_name} {city}"],
                "recommended_services": [
                    {"name": f"Standard {industry} Service", "description": f"Full-service quality solutions in {city}."},
                    {"name": "Consultation & Support", "description": "Expert guidance and personalized customer support."}
                ],
                "profile_completeness_score": 85,
                "seo_checklist": [
                    {"item": "Upload at least 5 photos monthly to boost Google Maps visibility", "importance": "High"},
                    {"item": "Reply to all incoming reviews within 24-48 hours", "importance": "Critical"},
                    {"item": "Publish weekly promotional posts and local updates", "importance": "High"},
                    {"item": "Ensure exact NAP (Name, Address, Phone) consistency across all citations", "importance": "Critical"}
                ],
            }
