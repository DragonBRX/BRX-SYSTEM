#!/usr/bin/env python3
"""
BRX SYSTEM - GitHub Project Scanner
Scan GitHub for trending AI open source projects
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List

import httpx


def search_github_repos(
    query: str,
    sort: str = "stars",
    order: str = "desc",
    per_page: int = 30,
    language: str = None,
    created_after: str = None,
) -> List[Dict[str, Any]]:
    """Search GitHub repositories."""

    q = query
    if language:
        q += f" language:{language}"
    if created_after:
        q += f" created:>{created_after}"

    url = "https://api.github.com/search/repositories"
    params = {
        "q": q,
        "sort": sort,
        "order": order,
        "per_page": per_page,
    }

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "BRX-System-Scanner/2.0",
    }

    try:
        resp = httpx.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        projects = []
        for item in data.get("items", []):
            projects.append({
                "id": item["id"],
                "name": item["full_name"],
                "description": item["description"],
                "url": item["html_url"],
                "stars": item["stargazers_count"],
                "forks": item["forks_count"],
                "language": item["language"],
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
                "topics": item.get("topics", []),
            })

        return projects
    except Exception as e:
        print(f"Error searching GitHub: {e}", file=sys.stderr)
        return []


def get_trending_repos(
    category: str = "ai",
    period: str = "daily",
    limit: int = 30,
) -> List[Dict[str, Any]]:
    """Get trending repositories."""

    queries = {
        "ai": "artificial intelligence OR machine learning OR deep learning OR LLM OR transformer",
        "agents": "AI agent OR autonomous agent OR multi-agent OR reinforcement learning",
        "vision": "computer vision OR image recognition OR object detection OR segmentation",
        "nlp": "natural language processing OR NLP OR text generation OR sentiment analysis",
        "audio": "speech recognition OR text to speech OR audio processing OR voice",
        "rag": "retrieval augmented generation OR RAG OR vector database OR embedding",
        "frameworks": "AI framework OR deep learning framework OR ML framework OR PyTorch OR TensorFlow",
    }

    query = queries.get(category, category)

    # Calculate date range
    if period == "daily":
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    elif period == "weekly":
        date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    elif period == "monthly":
        date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    else:
        date = None

    return search_github_repos(query, created_after=date, per_page=limit)


def save_projects(projects: List[Dict[str, Any]], output_path: str):
    """Save projects to JSON file."""
    with open(output_path, "w") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(projects)} projects to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="BRX GitHub Scanner")
    parser.add_argument("--category", default="ai", help="Project category")
    parser.add_argument("--period", default="weekly", choices=["daily", "weekly", "monthly"])
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--output", default="data/projects_scanned.json")
    parser.add_argument("--language", help="Filter by programming language")

    args = parser.parse_args()

    print(f"Scanning GitHub for {args.category} projects ({args.period})...")

    projects = get_trending_repos(
        category=args.category,
        period=args.period,
        limit=args.limit,
    )

    save_projects(projects, args.output)

    # Print summary
    print(f"
Found {len(projects)} projects:")
    for p in projects[:10]:
        print(f"  {p['name']} - {p['stars']} stars - {p['language'] or 'N/A'}")


if __name__ == "__main__":
    main()
