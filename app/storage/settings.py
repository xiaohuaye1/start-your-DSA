import json
from pathlib import Path


class Settings:
    DEFAULTS = {"gcc": "", "g++": "", "speed": 100, "last_lesson": "sorting.bubble_sort", "last_stage": "animation"}

    def __init__(self, directory: Path):
        self.path = directory / "settings.json"
        self.values = dict(self.DEFAULTS)
        if self.path.exists():
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    self.values.update(data)
            except (ValueError, OSError):
                pass

    def get(self, key, default=None):
        return self.values.get(key, default)

    def update(self, **values):
        self.values.update(values)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.values, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self.path)
