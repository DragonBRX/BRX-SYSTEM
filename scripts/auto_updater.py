#!/usr/bin/env python3
"""
BRX SYSTEM - Auto Updater
Update project statistics and metadata automatically
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

import httpx


def fetch_repo_info(repo_name: str) -> Dict[str, Any]:
    """Fetch repository information from GitHub."""
    url = f"https://api.github.com/repos/{repo_name}"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "BRX-System-Updater/2.0",
    }

    try:
        resp = httpx.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "stars": data["stargazers_count"],
                "forks": data["forks_count"],
                "open_issues": data["open_issues_count"],
                "updated_at": data["updated_at"],
                "description": data["description"],
                "language": data["language"],
            }
    except Exception as e:
        print(f"Error fetching {repo_name}: {e}", file=sys.stderr)

    return {}


def update_projects(projects_path: str, dry_run: bool = False):
    """Update all projects in the catalog."""

    path = Path(projects_path)
    if not path.exists():
        print(f"File not found: {projects_path}")
        return

    with open(path) as f:
        projects = json.load(f)

    updated = 0
    for project in projects:
        name = project.get("name", "")
        if "/" not in name:
            continue

        print(f"Updating {name}...")
        info = fetch_repo_info(name)

        if info:
            project["stars"] = info["stars"]
            project["forks"] = info["forks"]
            project["updated_at"] = info["updated_at"]
            project["language"] = info["language"]
            updated += 1

    if not dry_run:
        with open(path, "w") as f:
            json.dump(projects, f, indent=2, ensure_ascii=False)

    print(f"
Updated {updated}/{len(projects)} projects")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="BRX Auto Updater")
    parser.add_argument("--projects", default="data/projects_scanned.json")
    parser.add_argument("--dry-run", action="store_true")

    args = parser.parse_args()
    update_projects(args.projects, args.dry_run)


if __name__ == "__main__":
    main()
