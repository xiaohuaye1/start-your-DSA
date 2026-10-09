"""仅测试后端，不加载任何 Qt 图形界面。"""
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from PySide6.QtCore import QCoreApplication, QEventLoop, QTimer
from app.models import TestCase
from app.judge.runner import JudgeRunner
from app.storage.settings import Settings
from app.courses.loader import CourseLoader

APPLICATION = QCoreApplication.instance() or QCoreApplication([])
ROOT = Path(__file__).resolve().parent.parent


def wait_for(runner, start, cancel_after=None):
    loop = QEventLoop()
    results = []
    watchdog = QTimer()
    watchdog.setSingleShot(True)

    def done(result):
        results.append(result)
        loop.quit()

    runner.finished.connect(done)
    watchdog.timeout.connect(loop.quit)
    watchdog.start(30000)
    start()
    cancel_timer = QTimer()
    cancel_timer.setSingleShot(True)
    cancel_timer.timeout.connect(runner.cancel)
    if cancel_after is not None:
        cancel_timer.start(cancel_after)
    if not results:
        loop.exec()
    watchdog.stop()
    cancel_timer.stop()
    runner.finished.disconnect(done)
    if not results:
        runner.cancel()
        raise AssertionError("判题没有按时结束")
    return results[0]


@unittest.skipUnless(shutil.which("gcc"), "需要 GCC")
class JudgeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.settings = Settings(Path(self.temporary.name))
        self.runner = JudgeRunner(self.settings)
        self.loader = CourseLoader(ROOT / "content")
        self.lesson = self.loader.lessons["sorting.bubble_sort"]

    def tearDown(self):
        self.assertFalse(self.runner.busy)
        self.assertIsNone(self.runner.temporary)
        self.temporary.cleanup()

    def judge(self, code, cases=None, language="C", time_limit=2000):
        return wait_for(self.runner, lambda: self.runner.start(code, language,
                        cases or [TestCase("简单用例", "", "")], time_limit))

    def test_reference_c_all_cases(self):
        for relative, reference in (("problems/basic_sort", "reference.c"),
                                    ("problems/exam_01", "problems/exam_01/reference.c")):
            problem = self.loader.problem(self.lesson, relative)
            result = self.judge(self.loader.text(self.lesson, reference), problem.cases)
            self.assertEqual(result.verdict, "AC", result.message)
            self.assertEqual(len(result.cases), len(problem.cases))

    def test_all_added_references_c_and_cpp(self):
        languages = ["C", "C++"] if shutil.which("g++") else ["C"]
        for lesson in self.loader.lessons.values():
            if lesson.id == "sorting.bubble_sort":
                continue
            for stage in lesson.stages:
                if stage.kind != "practice":
                    continue
                problem = self.loader.problem(lesson, stage.source)
                reference = self.loader.text(lesson, stage.source + "/reference.c")
                for language in languages:
                    with self.subTest(lesson=lesson.id, stage=stage.id, language=language):
                        result = self.judge(reference, problem.cases, language)
                        self.assertEqual(result.verdict, "AC", result.message)
                        self.assertEqual(len(result.cases), 3)

    def test_all_added_templates_compile(self):
        for lesson in self.loader.lessons.values():
            if lesson.id == "sorting.bubble_sort":
                continue
            for stage in lesson.stages:
                if stage.kind == "practice":
                    problem = self.loader.problem(lesson, stage.source)
                    with self.subTest(lesson=lesson.id, stage=stage.id):
                        result = self.judge(problem.starter, [TestCase("template", problem.cases[0].input, None)])
                        self.assertEqual(result.verdict, "RUN", result.message)

    @unittest.skipUnless(shutil.which("g++"), "需要 G++")
    def test_cpp(self):
        code = '#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n*2;}'
        self.assertEqual(self.judge(code, [TestCase("CPP", "21\n", "42")], "C++").verdict, "AC")

    def test_compile_error(self):
        events = []
        self.runner.terminal.connect(events.append)
        self.assertEqual(self.judge("int main( { nope }").verdict, "CE")
        diagnostics = "".join(event["text"] for event in events if event["kind"] == "output")
        self.assertIn("error:", diagnostics)
        self.assertNotIn("编译失败", diagnostics)

    def test_raw_stdout_stderr_and_utf8(self):
        events = []
        self.runner.terminal.connect(events.append)
        code = '#include <stdio.h>\nint main(void){putchar(0xe4);fflush(stdout);putchar(0xb8);fflush(stdout);putchar(0xad);puts("");fputs("raw stderr\\n",stderr);}'
        result = self.judge(code, [TestCase("中文用例名称", "", None)])
        stdout = "".join(event["text"] for event in events if event.get("channel") == "stdout")
        stderr = "".join(event["text"] for event in events if event.get("channel") == "stderr" and event["phase"] == "run")
        newline = "\r\n" if os.name == "nt" else "\n"
        self.assertEqual(stdout, "中" + newline)
        self.assertEqual(stderr, "raw stderr" + newline)
        self.assertEqual(stdout, result.cases[0].actual)
        self.assertEqual(stderr, result.cases[0].stderr)
        self.assertNotIn("中文用例名称", "".join(event["text"] for event in events))

    @unittest.skipUnless(shutil.which("g++"), "需要 G++")
    def test_luogu_reference_cpp_lightweight_cases(self):
        problem = self.loader.problem(self.lesson, "problems/exam_01")
        result = self.judge(self.loader.text(self.lesson, "problems/exam_01/reference.c"), problem.cases, "C++")
        self.assertEqual(result.verdict, "AC", result.message)
        self.assertEqual(len(result.cases), 3)
        self.assertTrue(all(len(case.actual) < 100 for case in result.cases))

    def test_wrong_answer(self):
        result = self.judge('#include <stdio.h>\nint main(void){puts("wrong");}', [TestCase("WA", "", "right")])
        self.assertEqual(result.verdict, "WA")

    def test_runtime_error(self):
        self.assertEqual(self.judge("int main(void){return 1;}").verdict, "RE")

    def test_timeout(self):
        self.assertEqual(self.judge("int main(void){for(;;){}}", time_limit=150).verdict, "TLE")

    def test_output_limit(self):
        self.runner.OUTPUT_LIMIT = 8192
        code = '#include <stdio.h>\nint main(void){for(;;) puts("abcdefghijklmnopqrstuvwxyz0123456789");}'
        # Windows 管道刷新较慢，给超限检测留出时间，避免先触发运行超时。
        result = self.judge(code, time_limit=10000)
        self.assertEqual(result.verdict, "OLE")
        self.assertLessEqual(len(result.cases[0].actual.encode()), 8192)

    def test_exact_output_limit(self):
        self.runner.OUTPUT_LIMIT = 32
        code = '#include <stdio.h>\nint main(void){for(int i=0;i<32;++i) putchar(65);}'
        self.assertEqual(self.judge(code, [TestCase("exact", "", "A" * 32)]).verdict, "AC")

    def test_custom_input(self):
        code = '#include <stdio.h>\nint main(void){int n;scanf("%d",&n);printf("%d",n+1);}'
        result = self.judge(code, [TestCase("自定义", "41\n", None)])
        self.assertEqual(result.verdict, "RUN")
        self.assertEqual(result.cases[0].actual, "42")

    def test_cancel(self):
        result = wait_for(self.runner, lambda: self.runner.start("int main(void){for(;;){}}", "C",
                          [TestCase("cancel", "", "")]), cancel_after=30)
        self.assertEqual(result.verdict, "CANCELLED")

    def test_invalid_compiler(self):
        self.settings.update(gcc="Z:/does-not-exist/gcc.exe")
        self.assertEqual(self.judge("int main(void){return 0;}").verdict, "ENV")

    def test_failed_to_start(self):
        invalid = Path(self.temporary.name) / "not-a-compiler.exe"
        invalid.write_bytes(b"not an executable")
        self.settings.update(gcc=str(invalid))
        self.assertEqual(self.judge("int main(void){return 0;}").verdict, "ENV")
