"""Compile the actual standalone C/C++ references and test small workshops."""
import os
import random
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from app.courses.loader import CourseLoader
from app.judge.checker import matches
from workshop_oracles import CASES, LESSONS, workshop_answer

ROOT = Path(__file__).resolve().parent.parent


class WorkshopModels(unittest.TestCase):
    def test_shipped_case_names_match_unicode_sources(self):
        loader = CourseLoader(ROOT / "content")
        for lesson_id, expected in CASES.items():
            lesson = loader.lessons[lesson_id]
            stage = next(stage for stage in lesson.stages if stage.id == "practice")
            problem = loader.problem(lesson, stage.source)
            self.assertEqual([case.name for case in problem.cases],
                             [name for name, _ in expected], lesson_id)

    def test_hand_checked_examples(self):
        self.assertEqual(workshop_answer("trees.binary_tree", "AB##C##"),
                         "ABC\nBAC\nBCA\nABC\n2 2 3\n")
        self.assertEqual(workshop_answer("comprehensive.training", "4\n1 1 2 3\n"),
                         "13\n1 110\n2 111\n3 10\n4 0\n")
        self.assertEqual(workshop_answer("graphs.basics", CASES["graphs.basics"][0][1]),
                         "2 3 3 3 1\n0 2 3 4 7\n1 2 3 4 5\n7\n2\n")
        self.assertEqual(workshop_answer("linear.queue", "2 6\n1 0\n1 8\n2\n1 7\n7\n5\n"),
                         "OK\nOK\n0\nOK\n0 2\n8 7\n")
        self.assertEqual(workshop_answer("linear.circular_queue", "3 6\n1 0\n1 8\n2\n1 7\n7\n5\n"),
                         "OK\nOK\n0\nOK\n1 0\n8 7\n")

    def test_huffman_codes_are_prefix_free_and_wpl_matches_depth(self):
        rng = random.Random(20261010)
        for n in range(1, 9):
            for _ in range(4):
                weights = [rng.randint(1, 10) for _ in range(n)]
                result = workshop_answer("comprehensive.training", str(n) + "\n" + " ".join(map(str, weights)))
                lines = result.splitlines()
                codes = [line.split()[1] for line in lines[1:]]
                self.assertEqual(int(lines[0]), 0 if n == 1 else sum(w * len(c) for w, c in zip(weights, codes)))
                self.assertEqual(len(set(codes)), n)
                for i, a in enumerate(codes):
                    for j, b in enumerate(codes):
                        if i != j: self.assertFalse(b.startswith(a))


@unittest.skipUnless(shutil.which("gcc"), "需要 GCC；发布版使用内置 GCC")
class WorkshopReferences(unittest.TestCase):
    def compile(self, compiler, reference, output):
        standard = "c++17" if Path(compiler).stem in ("g++", "g++.exe") else "c11"
        result = subprocess.run([compiler, "-x", "c++" if standard == "c++17" else "c",
                                 "-std=" + standard, "-O0", "-Wall", "-Wextra",
                                 str(reference), "-o", str(output)], capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("warning:", result.stderr, "Reference should compile without warnings")

    def run_case(self, executable, lesson, text):
        result = subprocess.run([str(executable)], input=text, capture_output=True,
                                text=True, encoding="utf-8", timeout=3)
        self.assertEqual(result.returncode, 0, lesson + ": " + result.stderr)
        self.assertEqual(result.stderr, "")
        self.assertTrue(matches(result.stdout, workshop_answer(lesson, text)),
                        lesson + "\n" + text + "actual: " + result.stdout)

    def test_every_shipped_case_in_both_languages(self):
        loader = CourseLoader(ROOT / "content")
        languages = [("C", shutil.which("gcc"))]
        if shutil.which("g++"): languages.append(("CPP", shutil.which("g++")))
        with tempfile.TemporaryDirectory(prefix="dsa-workshop-references-") as directory:
            for lesson_id in sorted(LESSONS):
                lesson = loader.lessons[lesson_id]
                stage = next(stage for stage in lesson.stages if stage.id == "practice")
                problem = loader.problem(lesson, stage.source)
                for language, compiler in languages:
                    with self.subTest(lesson=lesson_id, language=language):
                        executable = Path(directory) / (lesson_id + language + ".exe")
                        self.compile(compiler, lesson.directory / stage.source / "reference.c", executable)
                        for case in problem.cases: self.run_case(executable, lesson_id, case.input)

    def test_short_generated_operation_sequences(self):
        rng = random.Random(4210)
        loader = CourseLoader(ROOT / "content")
        families = ["linear.arrays", "linear.linked_list", "linear.circular_list", "linear.doubly_list",
                    "linear.stack", "linear.queue", "linear.circular_queue"]
        with tempfile.TemporaryDirectory(prefix="dsa-workshop-generated-") as directory:
            for lesson_id in families:
                lesson = loader.lessons[lesson_id]
                executable = Path(directory) / (lesson_id + ".exe")
                self.compile(shutil.which("gcc"), lesson.directory / "problems/practice/reference.c", executable)
                for _ in range(12):
                    operations = []
                    if lesson_id in ("linear.stack", "linear.queue", "linear.circular_queue"):
                        header = "3 16\n"
                        maximum = 6 if lesson_id == "linear.stack" else 7
                        for _ in range(16):
                            op = rng.randint(1, maximum)
                            operations.append(str(op) + (" " + str(rng.randint(-3, 3)) if op == 1 else ""))
                    else:
                        header = "3 16\n1 2 3\n"
                        maximum = {"linear.arrays": 6, "linear.linked_list": 10,
                                   "linear.circular_list": 5, "linear.doubly_list": 6}[lesson_id]
                        for _ in range(16):
                            op = rng.randint(1, maximum)
                            line = str(op)
                            if op == 1: line += " %d %d" % (rng.randint(0, 7), rng.randint(-3, 3))
                            elif op == 2: line += " " + str(rng.randint(0, 7))
                            elif op == 3 and lesson_id in ("linear.arrays", "linear.linked_list"):
                                line += " " + str(rng.randint(-3, 3))
                            elif op == 3 and lesson_id == "linear.circular_list": line += " " + str(rng.randint(0, 10))
                            elif lesson_id == "linear.linked_list" and op == 7: line += " " + str(rng.randint(0, 7))
                            elif lesson_id == "linear.linked_list" and op in (9, 10): line += " " + str(rng.randint(-3, 3))
                            operations.append(line)
                    self.run_case(executable, lesson_id, header + "\n".join(operations) + "\n")


if __name__ == "__main__":
    unittest.main()
