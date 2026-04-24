"""
BRX SYSTEM - Agent API Routes
REST endpoints for agent management and execution
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from src.core.agents.base import (
    AgentConfig, AgentOrchestrator, AgentExecution, AgentStatus, AgentRole,
    ReActAgent, PlanningAgent, AGENT_TEMPLATES,
)
from src.core.tools import create_default_tool_registry
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Global orchestrator instance
orchestrator = AgentOrchestrator()
orchestrator.tool_registry = create_default_tool_registry()


class AgentCreateRequest(BaseModel):
    name: str
    role: str = "general"
    description: str = ""
    instructions: str = ""
    llm_provider: str = "ollama"
    model: str = "llama3.2"
    temperature: float = 0.7
    max_tokens: int = 4096
    tools: List[str] = []
    memory_enabled: bool = True
    streaming: bool = False


class AgentExecuteRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    stream: bool = False


class MultiAgentRequest(BaseModel):
    agents: List[str]
    query: str
    strategy: str = "sequential"
    context: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    execution_id: str
    agent_name: str
    query: str
    output: str
    status: str
    steps: int
    duration_ms: float
    tokens_used: int
    tools_used: List[str]


@router.post("/create", response_model=Dict[str, str])
async def create_agent(request: AgentCreateRequest):
    """Create a new agent."""
    try:
        role = AgentRole(request.role.lower())
        
        config = AgentConfig(
            name=request.name,
            role=role,
            description=request.description,
            instructions=request.instructions,
            llm_provider=request.llm_provider,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=request.tools,
            memory_enabled=request.memory_enabled,
            streaming=request.streaming,
        )
        
        if role == AgentRole.PLANNING:
            agent = PlanningAgent(config, orchestrator.tool_registry)
        else:
            agent = ReActAgent(config, orchestrator.tool_registry)
        
        orchestrator.register_agent(agent)
        
        logger.info("agent_created", name=request.name, role=request.role)
        return {"status": "created", "name": request.name, "role": request.role}
    
    except Exception as e:
        logger.error("agent_create_failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list", response_model=List[Dict[str, Any]])
async def list_agents():
    """List all registered agents."""
    agents = []
    for name, agent in orchestrator.agents.items():
        agents.append({
            "name": agent.config.name,
            "role": agent.config.role.value,
            "status": agent.status.value,
            "llm_provider": agent.config.llm_provider,
            "model": agent.config.model,
            "tools": agent.config.tools,
            "memory_enabled": agent.config.memory_enabled,
        })
    return agents


@router.post("/execute/{agent_name}", response_model=AgentResponse)
async def execute_agent(agent_name: str, request: AgentExecuteRequest):
    """Execute a single agent."""
    if agent_name not in orchestrator.agents:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    try:
        result = await orchestrator.execute_single(agent_name, request.query, request.context)
        
        return AgentResponse(
            execution_id=result.execution_id,
            agent_name=result.agent_name,
            query=result.input_query,
            output=result.final_output,
            status=result.status.value,
            steps=result.total_steps,
            duration_ms=result.total_duration_ms,
            tokens_used=result.tokens_used,
            tools_used=result.tools_used,
        )
    
    except Exception as e:
        logger.error("agent_execution_failed", agent=agent_name, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-multi", response_model=List[AgentResponse])
async def execute_multi_agent(request: MultiAgentRequest):
    """Execute multiple agents with coordination."""
    for name in request.agents:
        if name not in orchestrator.agents:
            raise HTTPException(status_code=404, detail=f"Agent '{name}' not found")
    
    try:
        results = await orchestrator.execute_multi_agent(
            request.agents, request.query, request.strategy, request.context
        )
        
        responses = []
        for result in results:
            if isinstance(result, Exception):
                continue
            responses.append(AgentResponse(
                execution_id=result.execution_id,
                agent_name=result.agent_name,
                query=result.input_query,
                output=result.final_output,
                status=result.status.value,
                steps=result.total_steps,
                duration_ms=result.total_duration_ms,
                tokens_used=result.tokens_used,
                tools_used=result.tools_used,
            ))
        
        return responses
    
    except Exception as e:
        logger.error("multi_agent_execution_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates", response_model=List[Dict[str, Any]])
async def list_templates():
    """List available agent templates."""
    return [
        {
            "id": key,
            "name": config.name,
            "role": config.role.value,
            "description": config.description,
            "tools": config.tools,
        }
        for key, config in AGENT_TEMPLATES.items()
    ]


@router.post("/from-template/{template_id}")
async def create_from_template(template_id: str, name: str):
    """Create an agent from a template."""
    if template_id not in AGENT_TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    
    config = AGENT_TEMPLATES[template_id]
    config.name = name
    
    agent = ReActAgent(config, orchestrator.tool_registry)
    orchestrator.register_agent(agent)
    
    return {"status": "created", "name": name, "template": template_id}


@router.get("/{agent_name}/status")
async def get_agent_status(agent_name: str):
    """Get agent status."""
    status = orchestrator.get_agent_status(agent_name)
    if not status:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    return status


@router.delete("/{agent_name}")
async def delete_agent(agent_name: str):
    """Delete an agent."""
    if agent_name not in orchestrator.agents:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    del orchestrator.agents[agent_name]
    return {"status": "deleted", "name": agent_name}
