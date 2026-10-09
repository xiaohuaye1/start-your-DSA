import json
from pathlib import Path
from app.models import Lesson, Stage, Problem, TestCase


class CourseLoader:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.catalog = self._json(self.root / "catalog.json")
        self.lessons = {}
        for chapter in self.catalog["chapters"]:
            for relative in chapter["lessons"]:
                directory = self._safe(self.root, relative)
                data = self._json(directory / "lesson.json")
                lesson = Lesson(data["id"], data["title"], directory,
                                tuple(Stage(**item) for item in data["stages"]))
                if lesson.id in self.lessons:
                    raise ValueError(f"课程 ID 重复：{lesson.id}")
                self.lessons[lesson.id] = lesson

    @staticmethod
    def _json(path):
        return json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def _safe(root, relative):
        path = (root / relative).resolve()
        if not path.is_relative_to(root.resolve()):
            raise ValueError("课程路径超出内容目录")
        return path

    def text(self, lesson, relative):
        return self._safe(lesson.directory, relative).read_text(encoding="utf-8")

    def problem(self, lesson, relative):
        directory = self._safe(lesson.directory, relative)
        data = self._json(directory / "problem.json")
        cases = []
        for entry in data["cases"]:
            if "file" in entry:
                case = self._safe(directory, entry["file"])
                input_text = case.with_suffix(".in").read_text(encoding="utf-8")
                expected = case.with_suffix(".out").read_text(encoding="utf-8")
            else:
                input_text, expected = entry["input"], entry["expected"]
                if not isinstance(input_text, str) or not isinstance(expected, str):
                    raise ValueError("内嵌用例的输入输出必须为文本")
            cases.append(TestCase(entry["name"], input_text, expected, entry.get("sample", False)))
        return Problem(data["id"], data["title"],
                       (directory / "statement.md").read_text(encoding="utf-8"),
                       (directory / "starter.c").read_text(encoding="utf-8"), tuple(cases),
                       data.get("time_limit_ms", 2000), data.get("source"))
