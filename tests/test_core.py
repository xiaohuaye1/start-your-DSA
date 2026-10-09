import tempfile
import unittest
from pathlib import Path
from app.courses.loader import CourseLoader
from app.judge.checker import matches
from app.storage.database import Database
from linear_oracles import linear_answer, bracket_answer


ROOT = Path(__file__).resolve().parent.parent


def expected_answer(lesson, stage, tokens):
    """Independent small-input oracle; do not assume every lesson is sorting."""
    if lesson.startswith('linear.') and lesson != 'linear.arrays':
        return linear_answer(lesson, stage, tokens)
    if lesson == "sorting.bubble_sort":
        assert tokens[0] == len(tokens) - 1
        return sorted(tokens[1:])
    if stage == "exam":
        if lesson == "intro.algorithm_complexity":
            assert len(tokens) == 2
            return [sum(tokens)]
        if lesson == "intro.data_structures":
            assert tokens[-1] == 0 and all(value > 0 for value in tokens[:-1])
            return tokens[-2::-1]
        if lesson == "intro.algorithm_analysis":
            assert len(tokens) == 1 and 1 <= tokens[0] <= 3
            total, n = 0.0, 0
            while total <= tokens[0]:
                n += 1
                total += 1.0 / n
            return [n]
        if lesson == "intro.struct_review":
            n = tokens[0]
            assert 5 <= n <= 8 and len(tokens) == 1 + n * 3
            rows = [(i + 1, tokens[1 + i * 3], sum(tokens[1 + i * 3:4 + i * 3])) for i in range(n)]
            rows.sort(key=lambda row: (-row[2], -row[1], row[0]))
            return [value for row in rows[:5] for value in (row[0], row[2])]
        if lesson == "linear.arrays":
            n, *a = tokens
            assert n == len(a)
            return [sum(value < a[i] for value in a[:i]) for i in range(n)]
    elif lesson == "intro.algorithm_complexity":
        assert tokens[0] == len(tokens) - 1
        return [sum(tokens[1:])]
    elif lesson == "intro.data_structures":
        assert tokens[0] == len(tokens) - 1
        return tokens[:0:-1]
    elif lesson == "intro.algorithm_analysis":
        assert len(tokens) == 1
        return [tokens[0] ** 2]
    elif lesson == "intro.struct_review":
        assert len(tokens) == 1 + tokens[0] * 2
        records = list(zip(tokens[1::2], tokens[2::2]))
        return list(min(records, key=lambda row: (-row[1], row[0])))
    elif lesson == "linear.arrays":
        n, index, value, *a = tokens
        assert len(a) == n and 0 <= index < n
        a[index] = value
        return a
    raise AssertionError("Missing lesson oracle: " + lesson)


class CoreTests(unittest.TestCase):
    def test_catalog_all_resources_and_expected_answers(self):
        loader = CourseLoader(ROOT / "content")
        self.assertEqual(len(loader.lessons), 11)
        problem_ids = set()
        for lesson in loader.lessons.values():
            self.assertEqual([stage.id for stage in lesson.stages], ["animation", "practice", "exam"])
            self.assertIn("#", loader.text(lesson, "explanation.md"))
            for stage in lesson.stages:
                if stage.kind == "practice":
                    problem = loader.problem(lesson, stage.source)
                    self.assertEqual(len(problem.cases), 3)
                    self.assertNotIn(problem.id, problem_ids)
                    problem_ids.add(problem.id)
                    self.assertTrue(any(case.sample for case in problem.cases))
                    self.assertTrue(loader.text(lesson, stage.source + "/starter.c"))
                    for case in problem.cases:
                        if lesson.id == 'linear.stack' and stage.id == 'exam':
                            self.assertLessEqual(len(case.input), 30)
                            self.assertTrue(matches(bracket_answer(case.input), case.expected))
                            continue
                        tokens = list(map(int, case.input.split()))
                        self.assertLessEqual(len(tokens), 25)
                        self.assertTrue(all(abs(value) <= 100 for value in tokens))
                        expected = " ".join(map(str, expected_answer(lesson.id, stage.id, tokens)))
                        self.assertTrue(matches(expected, case.expected))
                        if lesson.id == "sorting.bubble_sort" and stage.id == "exam":
                            values = tokens[1:]
                            self.assertLessEqual(len(values), 6)
                            self.assertTrue(all(1 <= value <= 9 for value in values))
                    if stage.id == "exam":
                        self.assertEqual(problem.source["platform"], "洛谷")
                        self.assertEqual(problem.source["url"], "https://www.luogu.com.cn/problem/" + problem.source["id"])
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
