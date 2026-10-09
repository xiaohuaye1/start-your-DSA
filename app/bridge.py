"""Electron 与现有 Python 模块之间的 JSON Lines 通道。"""
import json
import sys
import threading
import traceback
from dataclasses import asdict
from pathlib import Path
from PySide6.QtCore import QCoreApplication, QObject, Signal, QTimer
from app.paths import ROOT, data_directory
from app.courses.loader import CourseLoader
from app.storage.database import Database
from app.storage.settings import Settings
from app.judge.runner import JudgeRunner
from app.models import TestCase


def emit(message):
    print(json.dumps(message, ensure_ascii=False), flush=True)


class Bridge(QObject):
    incoming = Signal(object)

    def __init__(self, directory):
        super().__init__()
        directory.mkdir(parents=True, exist_ok=True)
        self.directory = directory
        self.settings = Settings(directory)
        self.database = Database(directory)
        self.loader = CourseLoader(ROOT / "content")
        self.stage_keys = {(lesson.id, stage.id) for lesson in self.loader.lessons.values() for stage in lesson.stages}
        self.problem_ids = {(lesson.id, stage.id): self.loader.problem(lesson, stage.source).id
                            for lesson in self.loader.lessons.values() for stage in lesson.stages if stage.kind == "practice"}
        self.runner = JudgeRunner(self.settings, self)
        self.runner.log.connect(lambda text: self.send_event("log", text))
        self.runner.terminal.connect(lambda event: self.send_event("terminal", event))
        self.runner.case_finished.connect(lambda case: self.send_event("case", asdict(case)))
        self.runner.finished.connect(self.judge_finished)
        self.incoming.connect(self.dispatch)
        self.job = None
        self.closing = False
        self.closed = False

    def send_event(self, event, payload):
        emit({"event": event, "payload": payload})

    def completed(self):
        # Keep saved history, but only credit practice submissions for the current problem.
        return sorted(key for key in self.database.completed() if key in self.stage_keys and
                      (key not in self.problem_ids or self.database.has_accepted_submission(self.problem_ids[key])))

    def lesson_stage(self, params):
        lesson = self.loader.lessons[params["lesson"]]
        stage = next(item for item in lesson.stages if item.id == params["stage"])
        return lesson, stage

    def problem(self, params):
        lesson, stage = self.lesson_stage(params)
        if stage.kind != "practice":
            raise ValueError("当前环节不是编程练习")
        return self.loader.problem(lesson, stage.source)

    def dispatch(self, request):
        try:
            method, params = request["method"], request.get("params", {})
            result = self.call(method, params)
            if "id" in request:
                emit({"id": request["id"], "result": result})
        except Exception as error:
            if "id" in request:
                emit({"id": request["id"], "error": str(error) or type(error).__name__})
            else:
                traceback.print_exc(file=sys.stderr)

    def call(self, method, params):
        if self.closing and method != "shutdown":
            raise RuntimeError("软件正在关闭")
        if method == "bootstrap":
            lessons = [{"id": lesson.id, "title": lesson.title, "stages": [asdict(stage) for stage in lesson.stages]}
                       for lesson in self.loader.lessons.values()]
            return {"lessons": lessons, "completed": self.completed(),
                    "settings": self.settings.values, "dataDirectory": str(self.directory)}
        if method == "load_stage":
            if self.runner.busy:
                raise RuntimeError("请等待判题结束或先停止")
            lesson, stage = self.lesson_stage(params)
            result = {"lesson": lesson.id, "title": lesson.title, "stage": asdict(stage),
                      "note": self.database.note(lesson.id)}
            if stage.kind == "animation":
                result["markdown"] = self.loader.text(lesson, "explanation.md")
            elif stage.kind == "reading":
                result["markdown"] = self.loader.text(lesson, stage.source)
            elif stage.kind == "practice":
                problem = self.loader.problem(lesson, stage.source)
                language = params.get("language", "C")
                result["problem"] = {"id": problem.id, "title": problem.title,
                    "statement": problem.statement, "starter": problem.starter, "caseCount": len(problem.cases),
                    "samples": [{"input": case.input, "expected": case.expected} for case in problem.cases if case.sample],
                    "source": problem.source}
                reference = lesson.directory / stage.source / "reference.c"
                result["reference"] = (reference.read_text(encoding="utf-8") if reference.exists()
                                       else self.loader.text(lesson, "reference.c"))
                draft = self.database.draft(problem.id, language)
                # Never prefill the editor. Ignore an unchanged legacy template, but
                # preserve the database record and any independently edited draft.
                template_only = draft is not None and draft.replace("\r\n", "\n") == problem.starter.replace("\r\n", "\n")
                result["draft"] = "" if draft is None or template_only else draft
                result["history"] = self.database.recent_submissions(problem.id)
            self.settings.update(last_lesson=lesson.id, last_stage=stage.id)
            return result
        if method == "save_draft":
            problem = self.problem(params)
            self.validate_code(params)
            self.database.save_draft(problem.id, params["language"], params["code"])
            return True
        if method == "save_note":
            lesson = self.loader.lessons[params["lesson"]]
            if not isinstance(params["text"], str) or len(params["text"]) > 1000000:
                raise ValueError("笔记过长")
            self.database.save_note(lesson.id, params["text"])
            return True
        if method == "complete":
            lesson, stage = self.lesson_stage(params)
            if stage.kind == "practice":
                raise ValueError("练习环节需要提交通过后完成")
            self.database.complete(lesson.id, stage.id)
            return self.completed()
        if method == "save_settings":
            allowed = {key: value for key, value in params.items() if key in ("gcc", "g++", "speed", "sidebar_width")}
            for key in ("gcc", "g++"):
                if key in allowed and not isinstance(allowed[key], str):
                    raise ValueError("编译器路径必须为字符串")
            if "speed" in allowed:
                allowed["speed"] = max(25, min(200, int(allowed["speed"])))
            if "sidebar_width" in allowed:
                width = allowed["sidebar_width"]
                if type(width) is not int or width != 0 and not 180 <= width <= 420:
                    raise ValueError("侧栏宽度必须为 180～420 的整数，或 0（恢复默认）")
            self.settings.update(**allowed)
            return self.settings.values
        if method == "judge":
            if self.runner.busy:
                raise RuntimeError("已有任务在运行")
            self.validate_code(params)
            problem = self.problem(params)
            mode = params["mode"]
            if mode not in ("sample", "submit", "custom"):
                raise ValueError("未知运行方式")
            if mode == "custom":
                input_text = params.get("input", "")
                if not isinstance(input_text, str) or len(input_text) > 1000000:
                    raise ValueError("输入过长")
                cases = [TestCase("自定义输入", input_text, None)]
            else:
                cases = [case for case in problem.cases if mode == "submit" or case.sample]
            self.job = dict(params, problem_id=problem.id)
            self.database.save_draft(problem.id, params["language"], params["code"])
            self.runner.start(params["code"], params["language"], cases, problem.time_limit_ms)
            return True
        if method == "cancel":
            self.runner.cancel()
            return True
        if method == "shutdown":
            self.closing = True
            if self.runner.busy:
                self.runner.cancel()
            else:
                self.close()
            return True
        raise ValueError("不支持的方法：" + str(method))

    @staticmethod
    def validate_code(params):
        if params.get("language") not in ("C", "C++"):
            raise ValueError("请选择 C 或 C++")
        if not isinstance(params.get("code"), str) or len(params["code"]) > 1000000:
            raise ValueError("代码过长或格式错误")

    def judge_finished(self, result):
        job = self.job
        if job:
            self.database.submission(job["problem_id"], job["language"], result.verdict, job["mode"], job["code"])
            if job["mode"] == "submit" and result.verdict == "AC":
                self.database.complete(job["lesson"], job["stage"])
            self.send_event("finished", {**asdict(result), "completed": self.completed(),
                                   "history": self.database.recent_submissions(job["problem_id"])})
        self.job = None
        if self.closing:
            self.close()

    def close(self):
        if not self.closed:
            self.closed = True
            self.database.close()
            QTimer.singleShot(0, QCoreApplication.quit)

    def listen(self):
        for line in sys.stdin:
            try:
                request = json.loads(line)
                if isinstance(request, dict):
                    self.incoming.emit(request)
            except ValueError:
                continue
        self.incoming.emit({"method": "shutdown"})


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stdin.reconfigure(encoding="utf-8")
    application = QCoreApplication(sys.argv)
    application.setApplicationName("StartYourDSA")
    application.setOrganizationName("StartYourDSA")
    directory = Path(sys.argv[sys.argv.index("--data-dir") + 1]) if "--data-dir" in sys.argv else data_directory()
    bridge = Bridge(directory)
    threading.Thread(target=bridge.listen, daemon=True).start()
    return application.exec()


if __name__ == "__main__":
    sys.exit(main())
