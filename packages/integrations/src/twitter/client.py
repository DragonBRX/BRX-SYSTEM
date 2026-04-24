"""
BRX SYSTEM - Twitter/X Integration Client
Social media monitoring and project discovery
"""

import httpx
from typing import Any, Dict, List, Optional
from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class TwitterClient:
    """Twitter/X API client."""

    BASE_URL = "https://api.twitter.com/2"

    def __init__(self):
        self.bearer_token = settings.TWITTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.bearer_token}" if self.bearer_token else None,
        }
        self.headers = {k: v for k, v in self.headers.items() if v is not None}

    async def search_tweets(
        self,
        query: str,
        max_results: int = 100,
        tweet_fields: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search tweets by query."""
        fields = tweet_fields or ["created_at", "author_id", "public_metrics", "lang"]

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/tweets/search/recent",
                params={
                    "query": query,
                    "max_results": min(max_results, 100),
                    "tweet.fields": ",".join(fields),
                },
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])

    async def get_user_tweets(
        self,
        user_id: str,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get tweets from a specific user."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/users/{user_id}/tweets",
                params={"max_results": min(max_results, 100)},
                headers=self.headers,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])

    async def discover_ai_projects(
        self,
        keywords: List[str] = None,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """Discover AI projects mentioned on Twitter."""
        keywords = keywords or [
            "open source AI",
            "github AI",
            "new AI model",
            "machine learning release",
            "LLM open source",
        ]

        all_tweets = []
        for keyword in keywords:
            tweets = await self.search_tweets(keyword, max_results=max_results // len(keywords))
            all_tweets.extend(tweets)

        # Filter for tweets with GitHub links
        import re
        github_pattern = re.compile(r"github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+")

        project_tweets = []
        for tweet in all_tweets:
            if github_pattern.search(tweet.get("text", "")):
                project_tweets.append(tweet)

        return project_tweets


class TweetAnalyzer:
    """Analyze tweets for AI project mentions."""

    def __init__(self):
        self.logger = get_logger("tweet_analyzer")

    def extract_github_links(self, text: str) -> List[str]:
        """Extract GitHub repository links from text."""
        import re
        pattern = re.compile(r"https?://github\.com/([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+)")
        return pattern.findall(text)

    def extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text."""
        import re
        pattern = re.compile(r"#(\w+)")
        return pattern.findall(text)

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Basic sentiment analysis."""
        positive_words = ["amazing", "awesome", "great", "love", "best", "incredible", "excited", "impressive"]
        negative_words = ["bad", "terrible", "awful", "hate", "worst", "disappointed", "useless"]

        text_lower = text.lower()
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)

        if pos_count > neg_count:
            sentiment = "positive"
        elif neg_count > pos_count:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "positive_words": pos_count,
            "negative_words": neg_count,
        }
