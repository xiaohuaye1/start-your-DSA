import tempfile
import unittest
from pathlib import Path
from app.courses.loader import CourseLoader
from app.judge.checker import matches
from app.storage.database import Database


ROOT = Path(__file__).resolve().parent.parent


class CoreTests(unittest.TestCase):
    def test_catalog_all_resources_and_expected_answers(self):
        loader = CourseLoader(ROOT / "content")
        for lesson in loader.lessons.values():
            self.assertEqual([stage.id for stage in lesson.stages], ["animation", "practice", "exam"])
            for stage in lesson.stages:
                if stage.kind == "practice":
                    problem = loader.problem(lesson, stage.source)
                    self.assertEqual(len(problem.cases), 3)
                    self.assertTrue(any(case.sample for case in problem.cases))
                    for case in problem.cases:
                        tokens = list(map(int, case.input.split()))
                        self.assertEqual(tokens[0], len(tokens) - 1)
                        values = tokens[1:]
                        self.assertLessEqual(len(values), 8)
                        self.assertTrue(all(abs(value) <= 100 for value in values))
                        expected = " ".join(map(str, sorted(values)))
                        self.assertTrue(matches(expected, case.expected))
                        if stage.id == "exam":
                            self.assertLessEqual(len(values), 6)
                            self.assertTrue(all(1 <= value <= 9 for value in values))
                    if stage.id == "exam":
                        self.assertEqual(problem.id, "luogu.P1177")
                        self.assertEqual(problem.source["url"], "https://www.luogu.com.cn/problem/P1177")
                elif stage.kind == "reading":
                    self.assertTrue(loader.text(lesson, stage.source))
        with self.assertRaises(ValueError):
            loader._safe(loader.root, "../package.json")

    def test_database_survives_reopen(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary)
            database = Database(path)
            database.complete("bubble", "animation")
            database.complete("bubble", "animation")
            database.save_note("bubble", "测试笔记")
            database.save_draft("sort", "C", "int main() {}")
            database.save_draft("sort", "C++", "different code")
            database.submission("sort", "C", "WA", "sample", "code")
            database.close()
            database = Database(path)
            self.assertEqual(database.completed(), {("bubble", "animation")})
            self.assertEqual(database.note("bubble"), "测试笔记")
            self.assertEqual(database.draft("sort", "C"), "int main() {}")
            self.assertEqual(database.draft("sort", "C++"), "different code")
            self.assertEqual(database.recent_submissions("sort")[0][0], "WA")
            self.assertFalse(database.has_accepted_submission("sort"))
            database.submission("sort", "C", "AC", "sample", "code")
            self.assertFalse(database.has_accepted_submission("sort"))
            database.submission("sort", "C", "AC", "submit", "code")
            self.assertTrue(database.has_accepted_submission("sort"))
            database.close()

    def test_changed_exam_does_not_inherit_old_completion(self):
        from PySide6.QtCore import QCoreApplication
        from app.bridge import Bridge
        application = QCoreApplication.instance() or QCoreApplication([])
        with tempfile.TemporaryDirectory() as temporary:
            bridge = Bridge(Path(temporary))
            key = ("sorting.bubble_sort", "exam")
            bridge.database.complete(*key)
            bridge.database.complete(key[0], "extension")
            bridge.database.submission("bubble_sort.adjacent_swaps", "C", "AC", "submit", "old code")
            self.assertNotIn(key, bridge.completed())
            self.assertNotIn((key[0], "extension"), bridge.completed())
            bridge.database.submission("luogu.P1177", "C", "AC", "submit", "new code")
            self.assertIn(key, bridge.completed())
            self.assertTrue(bridge.database.has_accepted_submission("bubble_sort.adjacent_swaps"))
            bridge.database.close()

    def test_checker_whitespace(self):
        self.assertTrue(matches("1 2\r\n3 ", "1\n2 3"))
        self.assertFalse(matches("1 2", "1 3"))
