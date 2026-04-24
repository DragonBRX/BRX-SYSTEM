"""
BRX SYSTEM - Tool Registry and Built-in Tools
Extensible tool system for agents
"""

import asyncio
import json
import subprocess
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime

import httpx
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ToolParameter:
    """Parameter definition for a tool."""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None
    enum: Optional[List[str]] = None


@dataclass
class ToolResult:
    """Result from tool execution."""
    success: bool
    output: str = ""
    error: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)


class Tool(ABC):
    """Base class for tools."""
    
    def __init__(self, name: str, description: str, parameters: List[ToolParameter]):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.logger = get_logger(f"tool.{name}")
        
    @abstractmethod
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        """Execute the tool with given inputs."""
        pass
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        """Validate input parameters."""
        errors = []
        for param in self.parameters:
            if param.required and param.name not in inputs:
                errors.append(f"Missing required parameter: {param.name}")
            if param.enum and inputs.get(param.name) not in param.enum:
                errors.append(f"Parameter {param.name} must be one of {param.enum}")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": [
                {
                    "name": p.name,
                    "type": p.type,
                    "description": p.description,
                    "required": p.required,
                    "default": p.default,
                    "enum": p.enum,
                }
                for p in self.parameters
            ],
        }


class ToolRegistry:
    """Registry for managing available tools."""
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        self.logger = get_logger("tool_registry")
        
    def register(self, tool: Tool) -> None:
        """Register a tool."""
        self._tools[tool.name] = tool
        self.logger.info("tool_registered", name=tool.name)
        
    def unregister(self, name: str) -> None:
        """Unregister a tool."""
        if name in self._tools:
            del self._tools[name]
            self.logger.info("tool_unregistered", name=name)
            
    def get_tool(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self._tools.get(name)
        
    def has_tool(self, name: str) -> bool:
        """Check if a tool exists."""
        return name in self._tools
        
    def list_tools(self) -> List[Dict[str, Any]]:
        """List all registered tools."""
        return [tool.to_dict() for tool in self._tools.values()]
        
    def get_tools_for_agent(self, tool_names: List[str]) -> List[Tool]:
        """Get specific tools for an agent."""
        return [self._tools[name] for name in tool_names if name in self._tools]


# Built-in tool implementations

class WebSearchTool(Tool):
    """Web search tool using multiple search engines."""
    
    def __init__(self):
        super().__init__(
            name="web_search",
            description="Search the web for information. Returns search results with titles, URLs, and snippets.",
            parameters=[
                ToolParameter("query", "string", "Search query string", True),
                ToolParameter("num_results", "integer", "Number of results (1-10)", False, 5),
                ToolParameter("engine", "string", "Search engine: google, duckduckgo, bing", False, "duckduckgo"),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        query = inputs.get("query", "")
        num = min(int(inputs.get("num_results", 5)), 10)
        engine = inputs.get("engine", "duckduckgo")
        
        try:
            results = []
            
            if engine == "duckduckgo":
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        "https://html.duckduckgo.com/html/",
                        params={"q": query},
                        timeout=10.0,
                    )
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(resp.text, "html.parser")
                    
                    for result in soup.select(".result")[:num]:
                        title_elem = result.select_one(".result__title")
                        snippet_elem = result.select_one(".result__snippet")
                        url_elem = result.select_one(".result__url")
                        
                        if title_elem:
                            results.append({
                                "title": title_elem.get_text(strip=True),
                                "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                                "url": url_elem.get_text(strip=True) if url_elem else "",
                            })
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=True,
                output=json.dumps(results, indent=2, ensure_ascii=False),
                data={"results": results, "engine": engine, "query": query},
                duration_ms=duration,
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class FetchURLTool(Tool):
    """Fetch and extract content from a URL."""
    
    def __init__(self):
        super().__init__(
            name="fetch_url",
            description="Fetch content from a URL and extract text.",
            parameters=[
                ToolParameter("url", "string", "URL to fetch", True),
                ToolParameter("extract_text", "boolean", "Extract main text content only", False, True),
                ToolParameter("max_length", "integer", "Maximum content length", False, 10000),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        url = inputs.get("url", "")
        extract_text = inputs.get("extract_text", True)
        max_length = inputs.get("max_length", 10000)
        
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, timeout=15.0)
                content = resp.text
                
                if extract_text:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(content, "html.parser")
                    
                    # Remove script and style elements
                    for script in soup(["script", "style", "nav", "footer", "header"]):
                        script.decompose()
                    
                    text = soup.get_text(separator="\n", strip=True)
                    lines = [line.strip() for line in text.splitlines() if line.strip()]
                    content = "\n".join(lines)[:max_length]
                else:
                    content = content[:max_length]
                
                duration = (datetime.utcnow() - start).total_seconds() * 1000
                
                return ToolResult(
                    success=True,
                    output=content,
                    data={"url": url, "status_code": resp.status_code, "content_length": len(content)},
                    duration_ms=duration,
                )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class CodeExecutionTool(Tool):
    """Execute Python code safely."""
    
    def __init__(self):
        super().__init__(
            name="execute_code",
            description="Execute Python code and return the output. Runs in a restricted environment.",
            parameters=[
                ToolParameter("code", "string", "Python code to execute", True),
                ToolParameter("timeout", "integer", "Execution timeout in seconds", False, 30),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        code = inputs.get("code", "")
        timeout = inputs.get("timeout", 30)
        
        # Security: restrict dangerous operations
        restricted = ["import os", "import sys", "__import__", "eval(", "exec(", "subprocess", "open("]
        for r in restricted:
            if r in code:
                return ToolResult(success=False, error=f"Restricted operation detected: {r}")
        
        try:
            # Execute in subprocess for isolation
            process = await asyncio.create_subprocess_exec(
                "python3", "-c", code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
            
            output = stdout.decode("utf-8", errors="replace")
            error = stderr.decode("utf-8", errors="replace")
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=process.returncode == 0 and not error,
                output=output,
                error=error if error else "",
                data={"return_code": process.returncode},
                duration_ms=duration,
            )
        except asyncio.TimeoutError:
            return ToolResult(success=False, error="Code execution timed out")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ShellCommandTool(Tool):
    """Execute shell commands."""
    
    SAFE_COMMANDS = ["ls", "cat", "echo", "grep", "find", "head", "tail", "wc", "curl", "git", "python3", "pip"]
    
    def __init__(self):
        super().__init__(
            name="shell_command",
            description="Execute a shell command. Only safe commands are allowed.",
            parameters=[
                ToolParameter("command", "string", "Shell command to execute", True),
                ToolParameter("cwd", "string", "Working directory", False, "."),
                ToolParameter("timeout", "integer", "Timeout in seconds", False, 60),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        command = inputs.get("command", "")
        cwd = inputs.get("cwd", ".")
        timeout = inputs.get("timeout", 60)
        
        # Validate command
        cmd_parts = command.split()
        if not cmd_parts or cmd_parts[0] not in self.SAFE_COMMANDS:
            return ToolResult(success=False, error=f"Command '{cmd_parts[0] if cmd_parts else ''}' not in safe command list")
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout,
            )
            
            output = stdout.decode("utf-8", errors="replace")
            error = stderr.decode("utf-8", errors="replace")
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=process.returncode == 0,
                output=output[:50000],  # Limit output size
                error=error[:10000] if error else "",
                data={"return_code": process.returncode},
                duration_ms=duration,
            )
        except asyncio.TimeoutError:
            return ToolResult(success=False, error="Command timed out")
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class DataQueryTool(Tool):
    """Query data using SQL or pandas operations."""
    
    def __init__(self):
        super().__init__(
            name="data_query",
            description="Query structured data using SQL-like operations or pandas.",
            parameters=[
                ToolParameter("data", "string", "JSON data or file path", True),
                ToolParameter("query", "string", "Query expression or SQL", True),
                ToolParameter("query_type", "string", "Type: sql, pandas, jsonpath", False, "pandas"),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        data_str = inputs.get("data", "")
        query = inputs.get("query", "")
        query_type = inputs.get("query_type", "pandas")
        
        try:
            import pandas as pd
            
            # Parse data
            try:
                data = json.loads(data_str)
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                elif isinstance(data, dict):
                    df = pd.DataFrame([data])
                else:
                    df = pd.read_json(data_str)
            except:
                try:
                    df = pd.read_csv(data_str)
                except:
                    return ToolResult(success=False, error="Could not parse data")
            
            if query_type == "pandas":
                # Execute pandas query
                result = eval(query, {"df": df, "pd": pd})
                if isinstance(result, pd.DataFrame):
                    output = result.to_json(orient="records", indent=2)
                else:
                    output = str(result)
            elif query_type == "sql":
                # Use pandasql or similar
                try:
                    from pandasql import sqldf
                    result = sqldf(query, locals())
                    output = result.to_json(orient="records", indent=2)
                except ImportError:
                    output = "pandasql not installed, using pandas instead"
                    result = df.query(query)
                    output = result.to_json(orient="records", indent=2)
            else:
                # jsonpath
                try:
                    from jsonpath_ng import parse
                    data_json = json.loads(df.to_json(orient="records"))
                    jsonpath_expr = parse(query)
                    matches = [match.value for match in jsonpath_expr.find(data_json)]
                    output = json.dumps(matches, indent=2, ensure_ascii=False)
                except ImportError:
                    return ToolResult(success=False, error="jsonpath-ng not installed")
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=True,
                output=output,
                data={"rows": len(df), "query": query},
                duration_ms=duration,
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class GitHubSearchTool(Tool):
    """Search GitHub repositories."""
    
    def __init__(self):
        super().__init__(
            name="github_search",
            description="Search GitHub repositories, users, or code.",
            parameters=[
                ToolParameter("query", "string", "Search query", True),
                ToolParameter("type", "string", "Search type: repositories, users, code, issues", False, "repositories"),
                ToolParameter("language", "string", "Filter by programming language", False, ""),
                ToolParameter("sort", "string", "Sort by: stars, forks, updated", False, "stars"),
                ToolParameter("per_page", "integer", "Results per page (max 100)", False, 10),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        query = inputs.get("query", "")
        search_type = inputs.get("type", "repositories")
        language = inputs.get("language", "")
        sort = inputs.get("sort", "stars")
        per_page = min(int(inputs.get("per_page", 10)), 100)
        
        try:
            q = query
            if language:
                q += f" language:{language}"
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://api.github.com/search/{search_type}",
                    params={"q": q, "sort": sort, "per_page": per_page},
                    headers={"Accept": "application/vnd.github.v3+json"},
                    timeout=15.0,
                )
                
                data = resp.json()
                items = data.get("items", [])
                
                simplified = []
                for item in items:
                    if search_type == "repositories":
                        simplified.append({
                            "name": item.get("full_name"),
                            "description": item.get("description"),
                            "stars": item.get("stargazers_count"),
                            "language": item.get("language"),
                            "url": item.get("html_url"),
                            "updated_at": item.get("updated_at"),
                        })
                    else:
                        simplified.append(item)
                
                duration = (datetime.utcnow() - start).total_seconds() * 1000
                
                return ToolResult(
                    success=True,
                    output=json.dumps(simplified, indent=2, ensure_ascii=False),
                    data={"total_count": data.get("total_count", 0), "query": q},
                    duration_ms=duration,
                )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class FileOperationsTool(Tool):
    """File read/write operations."""
    
    def __init__(self):
        super().__init__(
            name="file_operations",
            description="Read, write, or list files in the workspace.",
            parameters=[
                ToolParameter("operation", "string", "Operation: read, write, list, delete", True),
                ToolParameter("path", "string", "File or directory path", True),
                ToolParameter("content", "string", "Content to write (for write operation)", False, ""),
                ToolParameter("encoding", "string", "File encoding", False, "utf-8"),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        import os
        import pathlib
        
        start = datetime.utcnow()
        operation = inputs.get("operation", "")
        path = inputs.get("path", "")
        content = inputs.get("content", "")
        encoding = inputs.get("encoding", "utf-8")
        
        # Security: restrict to workspace
        allowed_base = pathlib.Path("data/workspace").resolve()
        target = (allowed_base / path).resolve()
        
        if not str(target).startswith(str(allowed_base)):
            return ToolResult(success=False, error="Path outside workspace not allowed")
        
        try:
            if operation == "read":
                if not target.exists():
                    return ToolResult(success=False, error="File not found")
                text = target.read_text(encoding=encoding)
                return ToolResult(
                    success=True,
                    output=text[:50000],
                    data={"path": str(target), "size": len(text)},
                    duration_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                )
                
            elif operation == "write":
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content, encoding=encoding)
                return ToolResult(
                    success=True,
                    output=f"File written: {target}",
                    data={"path": str(target), "size": len(content)},
                    duration_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                )
                
            elif operation == "list":
                if target.is_dir():
                    items = []
                    for item in target.iterdir():
                        items.append({
                            "name": item.name,
                            "type": "directory" if item.is_dir() else "file",
                            "size": item.stat().st_size if item.is_file() else 0,
                        })
                    return ToolResult(
                        success=True,
                        output=json.dumps(items, indent=2),
                        data={"path": str(target), "count": len(items)},
                        duration_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                    )
                else:
                    return ToolResult(success=False, error="Path is not a directory")
                    
            elif operation == "delete":
                if target.is_file():
                    target.unlink()
                elif target.is_dir():
                    import shutil
                    shutil.rmtree(target)
                return ToolResult(
                    success=True,
                    output=f"Deleted: {target}",
                    duration_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                )
                
            else:
                return ToolResult(success=False, error=f"Unknown operation: {operation}")
                
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class SummarizeTool(Tool):
    """Summarize text content."""
    
    def __init__(self):
        super().__init__(
            name="summarize",
            description="Summarize long text into key points.",
            parameters=[
                ToolParameter("text", "string", "Text to summarize", True),
                ToolParameter("max_length", "integer", "Maximum summary length", False, 500),
                ToolParameter("style", "string", "Style: brief, detailed, bullets", False, "brief"),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        text = inputs.get("text", "")
        max_length = inputs.get("max_length", 500)
        style = inputs.get("style", "brief")
        
        try:
            # Simple extractive summarization
            sentences = text.replace("!", ".").replace("?", ".").split(".")
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            
            if len(sentences) <= 3:
                summary = text[:max_length]
            else:
                # Take first, middle, and last sentences
                import random
                num_sentences = max(3, min(len(sentences) // 5, 10))
                selected = sentences[:num_sentences]
                
                if style == "bullets":
                    summary = "\n".join([f"- {s}" for s in selected])[:max_length]
                elif style == "detailed":
                    summary = " ".join(selected[:min(len(selected), num_sentences * 2)])[:max_length]
                else:
                    summary = " ".join(selected)[:max_length]
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=True,
                output=summary,
                data={"original_length": len(text), "summary_length": len(summary), "style": style},
                duration_ms=duration,
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class DockerManageTool(Tool):
    """Docker container management."""
    
    def __init__(self):
        super().__init__(
            name="docker_manage",
            description="Manage Docker containers and images.",
            parameters=[
                ToolParameter("command", "string", "Command: ps, images, run, stop, logs, exec", True),
                ToolParameter("container", "string", "Container name or ID", False, ""),
                ToolParameter("image", "string", "Image name", False, ""),
                ToolParameter("args", "string", "Additional arguments", False, ""),
            ],
        )
        
    async def execute(self, inputs: Dict[str, Any]) -> ToolResult:
        start = datetime.utcnow()
        command = inputs.get("command", "")
        container = inputs.get("container", "")
        image = inputs.get("image", "")
        args = inputs.get("args", "")
        
        SAFE_DOCKER = ["ps", "images", "logs", "inspect", "stats"]
        
        if command not in SAFE_DOCKER and command not in ["run", "stop", "exec"]:
            return ToolResult(success=False, error=f"Command '{command}' not allowed")
        
        try:
            if command == "ps":
                cmd = "docker ps -a --format '{{json .}}'"
            elif command == "images":
                cmd = "docker images --format '{{json .}}'"
            elif command == "logs" and container:
                cmd = f"docker logs --tail 100 {container}"
            elif command == "run" and image:
                cmd = f"docker run -d {args} {image}"
            elif command == "stop" and container:
                cmd = f"docker stop {container}"
            elif command == "exec" and container:
                cmd = f"docker exec {container} {args}"
            else:
                return ToolResult(success=False, error="Missing required parameters")
            
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30)
            
            output = stdout.decode("utf-8", errors="replace")
            error = stderr.decode("utf-8", errors="replace")
            
            duration = (datetime.utcnow() - start).total_seconds() * 1000
            
            return ToolResult(
                success=process.returncode == 0,
                output=output[:50000],
                error=error if error else "",
                data={"command": cmd},
                duration_ms=duration,
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


def create_default_tool_registry() -> ToolRegistry:
    """Create a registry with all default tools."""
    registry = ToolRegistry()
    
    registry.register(WebSearchTool())
    registry.register(FetchURLTool())
    registry.register(CodeExecutionTool())
    registry.register(ShellCommandTool())
    registry.register(DataQueryTool())
    registry.register(GitHubSearchTool())
    registry.register(FileOperationsTool())
    registry.register(SummarizeTool())
    registry.register(DockerManageTool())
    
    return registry
