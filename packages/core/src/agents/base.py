"""
BRX SYSTEM - AI Agent Framework
Complete agent orchestration system with memory, tools, and multi-step reasoning
"""

import asyncio
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, AsyncIterator
from uuid import uuid4

from src.core.logging import get_logger
from src.core.memory import ConversationMemory, MemoryEntry
from src.core.llm import LLMProvider, LLMMessage, LLMResponse
from src.core.tools import ToolRegistry, Tool, ToolResult
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class AgentStatus(Enum):
    """Agent execution status."""
    IDLE = "idle"
    THINKING = "thinking"
    USING_TOOL = "using_tool"
    WAITING = "waiting"
    COMPLETED = "completed"
    ERROR = "error"


class AgentRole(Enum):
    """Predefined agent roles."""
    GENERAL = "general"
    RESEARCH = "research"
    CODE = "code"
    ANALYSIS = "analysis"
    CREATIVE = "creative"
    PLANNING = "planning"
    REVIEW = "review"
    EXECUTOR = "executor"


@dataclass
class AgentConfig:
    """Configuration for an AI agent."""
    name: str
    role: AgentRole = AgentRole.GENERAL
    description: str = ""
    instructions: str = ""
    llm_provider: str = "ollama"
    model: str = "llama3.2"
    temperature: float = 0.7
    max_tokens: int = 4096
    max_iterations: int = 10
    timeout_seconds: int = 300
    tools: List[str] = field(default_factory=list)
    memory_enabled: bool = True
    memory_max_entries: int = 50
    streaming: bool = False
    verbose: bool = False
    stop_sequences: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentStep:
    """Single step in agent execution."""
    step_number: int
    thought: str = ""
    action: str = ""
    action_input: Dict[str, Any] = field(default_factory=dict)
    observation: str = ""
    tool_result: Optional[ToolResult] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    duration_ms: float = 0.0


@dataclass
class AgentExecution:
    """Complete agent execution result."""
    execution_id: str
    agent_name: str
    input_query: str
    final_output: str = ""
    steps: List[AgentStep] = field(default_factory=list)
    status: AgentStatus = AgentStatus.IDLE
    total_steps: int = 0
    total_duration_ms: float = 0.0
    tokens_used: int = 0
    tools_used: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class BaseAgent(ABC):
    """Base class for all agents."""
    
    def __init__(self, config: AgentConfig, tool_registry: ToolRegistry):
        self.config = config
        self.tool_registry = tool_registry
        self.memory = ConversationMemory(max_entries=config.memory_max_entries) if config.memory_enabled else None
        self.llm = LLMProvider.get_provider(config.llm_provider)
        self.status = AgentStatus.IDLE
        self.logger = get_logger(f"agent.{config.name}")
        
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentExecution:
        """Execute agent with the given query."""
        execution = AgentExecution(
            execution_id=str(uuid4()),
            agent_name=self.config.name,
            input_query=query,
            status=AgentStatus.THINKING,
            started_at=datetime.utcnow(),
        )
        
        try:
            self.status = AgentStatus.THINKING
            result = await self._run(execution, query, context or {})
            execution.status = AgentStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            return result
        except Exception as e:
            execution.status = AgentStatus.ERROR
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            self.logger.error("agent_execution_failed", error=str(e), execution_id=execution.execution_id)
            raise
        finally:
            self.status = AgentStatus.IDLE
            
    @abstractmethod
    async def _run(self, execution: AgentExecution, query: str, context: Dict[str, Any]) -> AgentExecution:
        """Override this method for specific agent logic."""
        pass


class ReActAgent(BaseAgent):
    """
    ReAct (Reasoning + Acting) Agent implementation.
    Uses chain-of-thought reasoning with tool usage.
    """
    
    REACT_PROMPT_TEMPLATE = """You are {name}, a {role} agent. {description}

Your instructions: {instructions}

You have access to the following tools:
{tools_description}

Use the following format:
Thought: you should always think about what to do
Action: the action to take, must be one of [{tool_names}]
Action Input: the input to the action as a JSON object
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Previous conversation:
{memory}

Question: {input}
Thought:"""

    FINAL_ANSWER_PATTERN = re.compile(r"Final Answer:\s*(.*)", re.DOTALL)
    ACTION_PATTERN = re.compile(r"Action:\s*(\w+)")
    ACTION_INPUT_PATTERN = re.compile(r"Action Input:\s*(\{.*?\})", re.DOTALL)
    THOUGHT_PATTERN = re.compile(r"Thought:\s*(.*?)(?=\n(?:Action|Final Answer):)", re.DOTALL)

    async def _run(self, execution: AgentExecution, query: str, context: Dict[str, Any]) -> AgentExecution:
        """Execute ReAct reasoning loop."""
        start_time = datetime.utcnow()
        
        # Build available tools
        available_tools = [
            self.tool_registry.get_tool(name) 
            for name in self.config.tools 
            if self.tool_registry.has_tool(name)
        ]
        
        tools_description = "\n".join([
            f"- {tool.name}: {tool.description}\n  Parameters: {tool.parameters}"
            for tool in available_tools
        ])
        
        tool_names = ", ".join([tool.name for tool in available_tools])
        
        # Memory context
        memory_context = ""
        if self.memory:
            recent = self.memory.get_recent(5)
            memory_context = "\n".join([
                f"Q: {entry.user_message}\nA: {entry.assistant_message}"
                for entry in recent
            ])
        
        # Build prompt
        prompt = self.REACT_PROMPT_TEMPLATE.format(
            name=self.config.name,
            role=self.config.role.value,
            description=self.config.description,
            instructions=self.config.instructions,
            tools_description=tools_description,
            tool_names=tool_names,
            memory=memory_context,
            input=query,
        )
        
        current_iteration = 0
        conversation_history = [LLMMessage(role="user", content=prompt)]
        
        while current_iteration < self.config.max_iterations:
            current_iteration += 1
            step_start = datetime.utcnow()
            
            # Get LLM response
            response = await self.llm.chat(
                messages=conversation_history,
                model=self.config.model,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
            
            raw_response = response.content
            
            # Extract thought
            thought_match = self.THOUGHT_PATTERN.search(raw_response)
            thought = thought_match.group(1).strip() if thought_match else raw_response
            
            # Check for final answer
            final_match = self.FINAL_ANSWER_PATTERN.search(raw_response)
            if final_match:
                final_answer = final_match.group(1).strip()
                execution.final_output = final_answer
                execution.total_steps = current_iteration
                execution.total_duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
                execution.tokens_used += response.tokens_used
                
                step = AgentStep(
                    step_number=current_iteration,
                    thought=thought,
                    observation="Final answer reached",
                    duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
                )
                execution.steps.append(step)
                
                # Store in memory
                if self.memory:
                    self.memory.add_entry(MemoryEntry(
                        user_message=query,
                        assistant_message=final_answer,
                        metadata={"tools_used": execution.tools_used},
                    ))
                
                return execution
            
            # Extract action
            action_match = self.ACTION_PATTERN.search(raw_response)
            action_input_match = self.ACTION_INPUT_PATTERN.search(raw_response)
            
            if action_match and action_input_match:
                action_name = action_match.group(1).strip()
                try:
                    action_input = json.loads(action_input_match.group(1))
                except json.JSONDecodeError:
                    action_input = {"input": action_input_match.group(1).strip()}
                
                # Execute tool
                self.status = AgentStatus.USING_TOOL
                tool = self.tool_registry.get_tool(action_name)
                
                if tool:
                    self.logger.info("executing_tool", tool=action_name, execution_id=execution.execution_id)
                    tool_result = await tool.execute(action_input)
                    
                    if action_name not in execution.tools_used:
                        execution.tools_used.append(action_name)
                    
                    observation = tool_result.output if tool_result.success else f"Error: {tool_result.error}"
                    
                    step = AgentStep(
                        step_number=current_iteration,
                        thought=thought,
                        action=action_name,
                        action_input=action_input,
                        observation=observation,
                        tool_result=tool_result,
                        duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
                    )
                    execution.steps.append(step)
                    
                    # Add observation to conversation
                    observation_msg = f"Observation: {observation}\nThought:"
                    conversation_history.append(LLMMessage(role="assistant", content=raw_response))
                    conversation_history.append(LLMMessage(role="user", content=observation_msg))
                else:
                    error_msg = f"Unknown tool: {action_name}"
                    step = AgentStep(
                        step_number=current_iteration,
                        thought=thought,
                        action=action_name,
                        observation=error_msg,
                        duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
                    )
                    execution.steps.append(step)
                    
                    conversation_history.append(LLMMessage(role="assistant", content=raw_response))
                    conversation_history.append(LLMMessage(role="user", content=f"Observation: {error_msg}\nThought:"))
            else:
                # No action found, treat as final answer
                final_answer = raw_response.strip()
                execution.final_output = final_answer
                execution.total_steps = current_iteration
                execution.total_duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
                execution.tokens_used += response.tokens_used
                
                step = AgentStep(
                    step_number=current_iteration,
                    thought=thought,
                    observation="Response without tool usage",
                    duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
                )
                execution.steps.append(step)
                
                if self.memory:
                    self.memory.add_entry(MemoryEntry(
                        user_message=query,
                        assistant_message=final_answer,
                    ))
                
                return execution
        
        # Max iterations reached
        execution.status = AgentStatus.ERROR
        execution.error_message = "Maximum iterations reached without conclusion"
        return execution


class PlanningAgent(BaseAgent):
    """
    Agent that creates plans before execution.
    Uses hierarchical task planning with sub-agents.
    """
    
    async def _run(self, execution: AgentExecution, query: str, context: Dict[str, Any]) -> AgentExecution:
        """Create plan and execute steps."""
        start_time = datetime.utcnow()
        
        # Step 1: Create plan
        plan_prompt = f"""You are a planning agent. Break down the following task into clear, actionable steps.

Task: {query}

Available tools: {', '.join(self.config.tools)}

Provide your response as a JSON list of steps, where each step has:
- "step": step number
- "description": what to do
- "tool": tool to use (if any, otherwise "none")
- "dependencies": list of step numbers this depends on

Response format:
```json
[
  {{"step": 1, "description": "...", "tool": "...", "dependencies": []}},
  {{"step": 2, "description": "...", "tool": "...", "dependencies": [1]}}
]
```"""
        
        plan_response = await self.llm.chat(
            messages=[LLMMessage(role="user", content=plan_prompt)],
            model=self.config.model,
            temperature=0.3,
            max_tokens=self.config.max_tokens,
        )
        
        # Extract plan
        try:
            plan_json = self._extract_json(plan_response.content)
            plan_steps = json.loads(plan_json)
        except (json.JSONDecodeError, ValueError):
            # Fallback: create simple single-step plan
            plan_steps = [{"step": 1, "description": query, "tool": "none", "dependencies": []}]
        
        # Step 2: Execute plan
        step_results = {}
        
        for step_data in plan_steps:
            step_num = step_data["step"]
            step_start = datetime.utcnow()
            
            # Check dependencies
            deps_satisfied = all(
                dep in step_results for dep in step_data.get("dependencies", [])
            )
            
            if not deps_satisfied:
                step = AgentStep(
                    step_number=step_num,
                    thought=f"Dependencies not satisfied for step {step_num}",
                    observation="Skipped due to unmet dependencies",
                    duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
                )
                execution.steps.append(step)
                continue
            
            # Execute step
            tool_name = step_data.get("tool", "none")
            description = step_data.get("description", "")
            
            if tool_name != "none" and self.tool_registry.has_tool(tool_name):
                tool = self.tool_registry.get_tool(tool_name)
                tool_input = {"input": description, **context}
                
                self.status = AgentStatus.USING_TOOL
                result = await tool.execute(tool_input)
                
                observation = result.output if result.success else f"Error: {result.error}"
                step_results[step_num] = observation
                
                if tool_name not in execution.tools_used:
                    execution.tools_used.append(tool_name)
            else:
                # No tool, just process with LLM
                step_prompt = f"Execute this step: {description}\n\nPrevious results: {step_results}"
                step_response = await self.llm.chat(
                    messages=[LLMMessage(role="user", content=step_prompt)],
                    model=self.config.model,
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                )
                observation = step_response.content
                step_results[step_num] = observation
                execution.tokens_used += step_response.tokens_used
            
            step = AgentStep(
                step_number=step_num,
                thought=description,
                action=tool_name if tool_name != "none" else "",
                observation=observation,
                duration_ms=(datetime.utcnow() - step_start).total_seconds() * 1000,
            )
            execution.steps.append(step)
        
        # Compile final answer
        final_prompt = f"""Given the following execution results, provide a comprehensive final answer.

Original task: {query}

Execution results:
{json.dumps(step_results, indent=2)}

Provide a clear, well-structured final answer."""
        
        final_response = await self.llm.chat(
            messages=[LLMMessage(role="user", content=final_prompt)],
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
        )
        
        execution.final_output = final_response.content
        execution.total_steps = len(plan_steps)
        execution.total_duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        execution.tokens_used += response.tokens_used + final_response.tokens_used
        
        if self.memory:
            self.memory.add_entry(MemoryEntry(
                user_message=query,
                assistant_message=execution.final_output,
                metadata={"tools_used": execution.tools_used, "plan": plan_steps},
            ))
        
        return execution
    
    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract JSON from markdown code blocks."""
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if json_match:
            return json_match.group(1)
        
        # Try to find array pattern
        array_match = re.search(r"(\[.*\])", text, re.DOTALL)
        if array_match:
            return array_match.group(1)
        
        raise ValueError("No JSON found in text")


class AgentOrchestrator:
    """
    Orchestrates multiple agents working together.
    Manages agent lifecycle and inter-agent communication.
    """
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.tool_registry = ToolRegistry()
        self.logger = get_logger("orchestrator")
        
    def register_agent(self, agent: BaseAgent) -> None:
        """Register an agent with the orchestrator."""
        self.agents[agent.config.name] = agent
        self.logger.info("agent_registered", name=agent.config.name, role=agent.config.role.value)
        
    def create_agent(self, config: AgentConfig) -> BaseAgent:
        """Create and register a new agent."""
        if config.role == AgentRole.PLANNING:
            agent = PlanningAgent(config, self.tool_registry)
        else:
            agent = ReActAgent(config, self.tool_registry)
        
        self.register_agent(agent)
        return agent
        
    async def execute_single(self, agent_name: str, query: str, context: Optional[Dict[str, Any]] = None) -> AgentExecution:
        """Execute a single agent."""
        if agent_name not in self.agents:
            raise ValueError(f"Agent '{agent_name}' not found")
        
        agent = self.agents[agent_name]
        return await agent.execute(query, context)
        
    async def execute_multi_agent(
        self, 
        agents: List[str], 
        query: str, 
        strategy: str = "sequential",
        context: Optional[Dict[str, Any]] = None,
    ) -> List[AgentExecution]:
        """Execute multiple agents with coordination."""
        results = []
        shared_context = context or {}
        
        if strategy == "sequential":
            for agent_name in agents:
                result = await self.execute_single(agent_name, query, shared_context)
                results.append(result)
                shared_context[f"{agent_name}_output"] = result.final_output
                
        elif strategy == "parallel":
            tasks = [self.execute_single(name, query, shared_context.copy()) for name in agents]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
        elif strategy == "supervisor":
            # First agent is supervisor, rest are workers
            if not agents:
                return results
                
            supervisor = agents[0]
            workers = agents[1:]
            
            # Supervisor creates sub-tasks
            supervisor_result = await self.execute_single(
                supervisor, 
                f"Divide this task among workers: {query}\nWorkers: {', '.join(workers)}",
                shared_context,
            )
            
            # Workers execute sub-tasks
            worker_tasks = []
            for worker_name in workers:
                task = self.execute_single(
                    worker_name,
                    f"Execute your part of: {query}\nSupervisor plan: {supervisor_result.final_output}",
                    shared_context,
                )
                worker_tasks.append(task)
            
            worker_results = await asyncio.gather(*worker_tasks, return_exceptions=True)
            results = [supervisor_result] + list(worker_results)
            
        return results
        
    def get_agent_status(self, agent_name: Optional[str] = None) -> Dict[str, Any]:
        """Get status of one or all agents."""
        if agent_name:
            if agent_name not in self.agents:
                return {}
            agent = self.agents[agent_name]
            return {
                "name": agent.config.name,
                "role": agent.config.role.value,
                "status": agent.status.value,
                "memory_entries": len(agent.memory.entries) if agent.memory else 0,
            }
        
        return {
            name: {
                "role": agent.config.role.value,
                "status": agent.status.value,
            }
            for name, agent in self.agents.items()
        }


# Pre-configured agent templates
AGENT_TEMPLATES = {
    "research": AgentConfig(
        name="research_agent",
        role=AgentRole.RESEARCH,
        description="An agent specialized in researching topics and gathering information",
        instructions="You are a research specialist. Use search tools to find accurate information, analyze sources, and provide comprehensive summaries with citations.",
        tools=["web_search", "fetch_url", "summarize"],
    ),
    "code": AgentConfig(
        name="code_agent",
        role=AgentRole.CODE,
        description="An agent specialized in programming and software development",
        instructions="You are a senior software engineer. Analyze code, fix bugs, implement features, and provide well-documented solutions. Always follow best practices.",
        tools=["code_analysis", "file_operations", "execute_code"],
    ),
    "analysis": AgentConfig(
        name="analysis_agent",
        role=AgentRole.ANALYSIS,
        description="An agent specialized in data analysis and visualization",
        instructions="You are a data analyst. Process datasets, perform statistical analysis, create visualizations, and derive actionable insights.",
        tools=["data_query", "chart_generation", "statistical_analysis"],
    ),
    "creative": AgentConfig(
        name="creative_agent",
        role=AgentRole.CREATIVE,
        description="An agent specialized in creative writing and content generation",
        instructions="You are a creative assistant. Generate original content, stories, marketing copy, and creative ideas based on user requirements.",
        tools=["image_generation", "content_expansion", "style_transfer"],
    ),
    "review": AgentConfig(
        name="review_agent",
        role=AgentRole.REVIEW,
        description="An agent specialized in reviewing and critiquing content",
        instructions="You are a critical reviewer. Analyze content for quality, accuracy, style, and compliance. Provide constructive feedback.",
        tools=["plagiarism_check", "grammar_check", "style_analysis"],
    ),
    "executor": AgentConfig(
        name="executor_agent",
        role=AgentRole.EXECUTOR,
        description="An agent specialized in executing commands and managing systems",
        instructions="You are a system executor. Run commands, manage files, configure systems, and automate workflows. Always verify before destructive operations.",
        tools=["shell_command", "file_operations", "system_info", "docker_manage"],
    ),
}
