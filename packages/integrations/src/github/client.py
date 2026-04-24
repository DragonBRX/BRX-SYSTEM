"""
BRX SYSTEM - GitHub Integration Client
Repository scanning, issue tracking, webhook handling
"""

import httpx
from typing import Any, Dict, List, Optional
from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class GitHubClient:
    """GitHub API client for BRX SYSTEM."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: str = None):
        self.token = token or settings.GITHUB_TOKEN
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"Bearer {self.token}" if self.token else None,
            "User-Agent": "BRX-System/2.0",
        }
        self.headers = {k: v for k, v in self.headers.items() if v is not None}

    async def search_repositories(
        self,
        query: str,
        sort: str = "stars",
        order: str = "desc",
        per_page: int = 30,
    ) -> List[Dict[str, Any]]:
        """Search GitHub repositories."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/search/repositories",
                params={"q": query, "sort": sort, "order": order, "per_page": per_page},
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])

    async def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """Get repository details."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}",
                headers=self.headers,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_readme(self, owner: str, repo: str) -> str:
        """Get repository README content."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/readme",
                headers={**self.headers, "Accept": "application/vnd.github.v3.raw"},
                timeout=15,
            )
            if resp.status_code == 200:
                return resp.text
            return ""

    async def list_issues(self, owner: str, repo: str, state: str = "open") -> List[Dict[str, Any]]:
        """List repository issues."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/issues",
                params={"state": state, "per_page": 100},
                headers=self.headers,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_trending(
        self,
        language: str = None,
        since: str = "daily",
        per_page: int = 25,
    ) -> List[Dict[str, Any]]:
        """Get trending repositories."""
        date_filter = {
            "daily": "created:>" + __import__("datetime").datetime.now().strftime("%Y-%m-%d"),
            "weekly": "created:>" + (__import__("datetime").datetime.now() - __import__("datetime").timedelta(days=7)).strftime("%Y-%m-%d"),
            "monthly": "created:>" + (__import__("datetime").datetime.now() - __import__("datetime").timedelta(days=30)).strftime("%Y-%m-%d"),
        }

        query = date_filter.get(since, "")
        if language:
            query += f" language:{language}"

        return await self.search_repositories(query, per_page=per_page)


class GitHubWebhookHandler:
    """Handle GitHub webhooks for real-time updates."""

    def __init__(self, secret: str = None):
        self.secret = secret or settings.GITHUB_WEBHOOK_SECRET
        self.logger = get_logger("github_webhook")

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature."""
        if not self.secret:
            return True

        import hmac
        import hashlib

        expected = "sha256=" + hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    def handle_push(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle push event."""
        repo = payload.get("repository", {})
        commits = payload.get("commits", [])

        self.logger.info(
            "push_received",
            repo=repo.get("full_name"),
            commits=len(commits),
            branch=payload.get("ref", "").replace("refs/heads/", ""),
        )

        return {
            "event": "push",
            "repository": repo.get("full_name"),
            "commits": len(commits),
        }

    def handle_release(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle release event."""
        release = payload.get("release", {})
        repo = payload.get("repository", {})

        self.logger.info(
            "release_received",
            repo=repo.get("full_name"),
            tag=release.get("tag_name"),
        )

        return {
            "event": "release",
            "repository": repo.get("full_name"),
            "tag": release.get("tag_name"),
        }
