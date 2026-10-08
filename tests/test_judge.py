"""仅测试后端，不加载任何 Qt 图形界面。"""
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
            self.assertEqual(len(result.cases), 5)

    @unittest.skipUnless(shutil.which("g++"), "需要 G++")
    def test_cpp(self):
        code = '#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n*2;}'
        self.assertEqual(self.judge(code, [TestCase("CPP", "21\n", "42")], "C++").verdict, "AC")

    def test_compile_error(self):
        self.assertEqual(self.judge("int main( { nope }").verdict, "CE")

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
        result = self.judge(code)
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
