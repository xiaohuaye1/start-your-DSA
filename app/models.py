"""模块间传递的数据，不依赖 GUI。"""
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Stage:
    id: str
    title: str
    kind: str
    source: str


@dataclass(frozen=True)
class Lesson:
    id: str
    title: str
    directory: Path
    stages: tuple[Stage, ...]


@dataclass(frozen=True)
class TestCase:
    name: str
    input: str
    expected: str | None
    sample: bool = False


@dataclass(frozen=True)
class Problem:
    id: str
    title: str
    statement: str
    starter: str
    cases: tuple[TestCase, ...]
    time_limit_ms: int = 2000


@dataclass(frozen=True)
class CaseResult:
    name: str
    verdict: str
    actual: str = ""
    expected: str | None = None
    stderr: str = ""
    elapsed_ms: int = 0


@dataclass(frozen=True)
class JudgeResult:
    verdict: str
    message: str
    cases: tuple[CaseResult, ...] = ()
