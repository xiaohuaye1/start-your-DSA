import tempfile
import unittest
from pathlib import Path
from app.courses.loader import CourseLoader
from app.judge.checker import matches
from app.storage.database import Database
from linear_oracles import linear_answer, bracket_answer
from sorting_oracles import sorting_answer
from advanced_oracles import LESSONS, advanced_answer
from final_oracles import LESSONS as FINAL_LESSONS, final_answer


ROOT = Path(__file__).resolve().parent.parent


def expected_answer(lesson, stage, tokens):
    """Independent small-input oracle; do not assume every lesson is sorting."""
    if lesson == 'linear.circular_queue' or lesson.startswith('sorting.') and lesson != 'sorting.bubble_sort':
        return sorting_answer(lesson, stage, tokens)
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
    def test_bridge_reports_unknown_courses_and_stages_without_internal_exceptions(self):
        from PySide6.QtCore import QCoreApplication
        from unittest.mock import patch
        from app.bridge import Bridge
        application = QCoreApplication.instance() or QCoreApplication([])
        with tempfile.TemporaryDirectory() as temporary:
            bridge = Bridge(Path(temporary))
            try:
                initial_settings = dict(bridge.settings.values)
                for method in ("load_stage", "save_draft", "judge", "complete"):
                    for params, message in (
                        ({"lesson": "nope", "stage": "animation"}, "课程不存在"),
                        ({"lesson": "sorting.bubble_sort", "stage": "nope"}, "课程环节不存在"),
                        ({}, "课程不存在"),
                        ({"lesson": [], "stage": "practice"}, "课程不存在"),
                        ({"lesson": "sorting.bubble_sort", "stage": []}, "课程环节不存在"),
                    ):
                        request = {"id": 123, "method": method,
                                   "params": {**params, "language": "C", "code": "", "mode": "submit"}}
                        with self.subTest(method=method, params=params), patch("app.bridge.emit") as send:
                            bridge.dispatch(request)
                            reply = send.call_args.args[0]
                            self.assertEqual(reply["id"], 123)
                            self.assertIn(message, reply["error"])
                            self.assertNotIn("StopIteration", reply["error"])
                            self.assertNotIn("'nope'", reply["error"])
                with self.assertRaisesRegex(ValueError, "课程不存在"):
                    bridge.call("save_note", {"lesson": "nope", "text": "keep this note"})
                with self.assertRaisesRegex(ValueError, "请选择 C 或 C"):
                    bridge.call("load_stage", {"lesson": "sorting.bubble_sort", "stage": "practice", "language": "JAVA"})
                self.assertEqual(bridge.settings.values, initial_settings)
                self.assertFalse(bridge.runner.busy)
                self.assertIsNone(bridge.job)
            finally:
                bridge.database.close()

    def test_speed_requires_an_integer_in_range_and_invalid_values_do_not_change_settings(self):
        from PySide6.QtCore import QCoreApplication
        from app.bridge import Bridge
        from app.storage.settings import Settings
        application = QCoreApplication.instance() or QCoreApplication([])
        with tempfile.TemporaryDirectory() as temporary:
            bridge = Bridge(Path(temporary))
            try:
                bridge.call("save_settings", {"speed": 125, "gcc": "existing-gcc.exe"})
                initial = dict(bridge.settings.values)
                for invalid in (None, "abc", "100", True, False, 24, 201, -1, 100.5, 100.0,
                                float("nan"), float("inf"), [], {}):
                    with self.subTest(speed=invalid), self.assertRaisesRegex(ValueError, "播放速度"):
                        bridge.call("save_settings", {"speed": invalid, "gcc": "must-not-be-saved.exe"})
                    self.assertEqual(bridge.settings.values, initial)
                    self.assertEqual(Settings(Path(temporary)).values, initial)
                for valid in (25, 50, 75, 100, 125, 150, 200):
                    self.assertEqual(bridge.call("save_settings", {"speed": valid})["speed"], valid)
                    self.assertEqual(Settings(Path(temporary)).get("speed"), valid)
            finally:
                bridge.database.close()

    def test_practice_editors_start_blank_and_preserve_personal_drafts(self):
        from PySide6.QtCore import QCoreApplication
        from app.bridge import Bridge
        application = QCoreApplication.instance() or QCoreApplication([])
        with tempfile.TemporaryDirectory() as temporary:
            bridge = Bridge(Path(temporary))
            try:
                count = 0
                for lesson in bridge.loader.lessons.values():
                    for stage in lesson.stages:
                        if stage.kind != "practice":
                            continue
                        problem = bridge.loader.problem(lesson, stage.source)
                        for language in ("C", "C++"):
                            params = {"lesson": lesson.id, "stage": stage.id, "language": language}
                            self.assertEqual(bridge.call("load_stage", params)["draft"], "")
                            legacy_template = problem.starter.replace("\n", "\r\n")
                            bridge.database.save_draft(problem.id, language, legacy_template)
                            self.assertEqual(bridge.call("load_stage", params)["draft"], "")
                            self.assertEqual(bridge.database.draft(problem.id, language), legacy_template,
                                             "Legacy records are not deleted from the database")
                            authored = problem.starter + "\n/* my changes */\n"
                            bridge.database.save_draft(problem.id, language, authored)
                            self.assertEqual(bridge.call("load_stage", params)["draft"], authored)
                            bridge.database.save_draft(problem.id, language, "")
                            self.assertEqual(bridge.call("load_stage", params)["draft"], "")
                            count += 1
                self.assertEqual(count, 112)
            finally:
                bridge.database.close()

    def test_sidebar_settings_persist_without_changing_learning_or_compiler_settings(self):
        from PySide6.QtCore import QCoreApplication
        from app.bridge import Bridge
        from app.storage.settings import Settings
        application = QCoreApplication.instance() or QCoreApplication([])
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            settings = Settings(directory)
            self.assertEqual(settings.get("sidebar_width"), 0)
            settings.update(gcc="my-gcc.exe", speed=125, last_lesson="sorting.bubble_sort")
            bridge = Bridge(directory)
            try:
                bridge.call("save_settings", {"sidebar_width": 360})
                restored = Settings(directory)
                self.assertEqual(restored.get("sidebar_width"), 360)
                self.assertEqual(restored.get("gcc"), "my-gcc.exe")
                self.assertEqual(restored.get("speed"), 125)
                self.assertEqual(restored.get("last_lesson"), "sorting.bubble_sort")
                for invalid in (-1, 179, 421, True, "222", 222.5, None):
                    with self.assertRaises(ValueError):
                        bridge.call("save_settings", {"sidebar_width": invalid})
                self.assertEqual(Settings(directory).get("sidebar_width"), 360)
                bridge.call("save_settings", {"sidebar_width": 0})
                self.assertEqual(Settings(directory).get("sidebar_width"), 0)
            finally:
                bridge.database.close()

    def test_catalog_all_resources_and_expected_answers(self):
        loader = CourseLoader(ROOT / "content")
        self.assertEqual(len(loader.lessons), 28)
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
                        if lesson.id in LESSONS:
                            self.assertTrue(matches(advanced_answer(lesson.id, stage.id, case.input), case.expected))
                            if lesson.id == 'trees.binary_tree' and stage.id == 'exam':
                                self.assertLessEqual(len(case.input.split()), 8)
                                continue
                        if lesson.id in FINAL_LESSONS:
                            self.assertTrue(matches(final_answer(lesson.id, stage.id, case.input), case.expected))
                            if lesson.id == 'advanced.hash_table' and stage.id == 'exam':
                                self.assertLessEqual(len(case.input.split()), 8)
                                self.assertTrue(all(len(word)<=10 for word in case.input.split()[1:]))
                                continue
                        tokens = list(map(int, case.input.split()))
                        self.assertLessEqual(len(tokens), 25)
                        self.assertTrue(all(abs(value) <= 100 for value in tokens))
                        expected = final_answer(lesson.id, stage.id, case.input) if lesson.id in FINAL_LESSONS else advanced_answer(lesson.id, stage.id, case.input) if lesson.id in LESSONS else " ".join(map(str, expected_answer(lesson.id, stage.id, tokens)))
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

    def test_reused_luogu_exams_have_independent_drafts_and_progress(self):
        from PySide6.QtCore import QCoreApplication
        from app.bridge import Bridge
        application = QCoreApplication.instance() or QCoreApplication([])
        pairs = [('linear.circular_list', 'linear.circular_queue'),
                 ('sorting.bubble_sort', 'sorting.quick_sort'),
                 ('sorting.quick_sort', 'sorting.merge_sort'),
                 ('sorting.merge_sort', 'sorting.heap_sort')]
        with tempfile.TemporaryDirectory() as temporary:
            bridge = Bridge(Path(temporary))
            for old, new in pairs:
                old_id = bridge.problem_ids[(old, 'exam')]
                new_id = bridge.problem_ids[(new, 'exam')]
                self.assertNotEqual(old_id, new_id)
                bridge.database.complete(old, 'exam')
                bridge.database.complete(new, 'exam')
                bridge.database.save_draft(old_id, 'C', 'old lesson code')
                bridge.database.save_draft(new_id, 'C', 'new lesson code')
                bridge.database.submission(old_id, 'C', 'AC', 'submit', 'old lesson code')
                self.assertIn((old, 'exam'), bridge.completed())
                self.assertNotIn((new, 'exam'), bridge.completed())
                self.assertEqual(bridge.database.draft(old_id, 'C'), 'old lesson code')
                self.assertEqual(bridge.database.draft(new_id, 'C'), 'new lesson code')
                bridge.database.submission(new_id, 'C', 'AC', 'submit', 'new lesson code')
                self.assertIn((new, 'exam'), bridge.completed())
            bridge.database.close()
