from enum import StrEnum


class ProjectStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class InitiativeStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"


class TaskStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"


class Priority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
