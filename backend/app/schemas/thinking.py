from enum import Enum

from pydantic import BaseModel, Field


class ThinkingMode(str, Enum):
    BREAKDOWN = "breakdown"
    COUNTER = "counter"
    EXPAND = "expand"
    ACTION = "action"


class ThinkingRequest(BaseModel):
    mode: ThinkingMode


class ThinkingResponse(BaseModel):
    mode: ThinkingMode
    summary: str
    key_points: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    counter_arguments: list[str] = Field(default_factory=list)
    action_steps: list[str] = Field(default_factory=list)
