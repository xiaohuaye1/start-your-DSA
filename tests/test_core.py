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
            self.assertEqual(len(lesson.stages), 4)
            for stage in lesson.stages:
                if stage.kind == "practice":
                    problem = loader.problem(lesson, stage.source)
                    self.assertTrue(any(case.sample for case in problem.cases))
                    for case in problem.cases:
                        tokens = list(map(int, case.input.split()))
                        self.assertEqual(tokens[0], len(tokens) - 1)
                        values = tokens[1:]
                        expected = " ".join(map(str, sorted(values))) if stage.id == "practice" else str(sum(values[i] > values[j] for i in range(len(values)) for j in range(i+1, len(values))))
                        self.assertTrue(matches(expected, case.expected))
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
            database.close()

    def test_checker_whitespace(self):
        self.assertTrue(matches("1 2\r\n3 ", "1\n2 3"))
        self.assertFalse(matches("1 2", "1 3"))
