import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from app.judge.compiler import resolve_compiler, compiler_path, compiler_environment


class PortableCompilerTests(unittest.TestCase):
    def test_bundled_compilers_work_without_path_and_old_missing_settings_fall_back(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "bin").mkdir()
            for name in ("gcc.exe", "g++.exe"):
                (root / "bin" / name).touch()
            with patch.dict(os.environ, {"DSA_TOOLCHAIN": str(root)}, clear=True), patch("shutil.which", return_value=None):
                for language, name in (("C", "gcc"), ("C++", "g++")):
                    expected = str((root / "bin" / (name + ".exe")).resolve())
                    self.assertEqual(resolve_compiler(language, {}), expected)
                    self.assertEqual(resolve_compiler(language, {name: str(root / "missing.exe")}), expected)
                    override = root / (name + "-custom.exe")
                    override.touch()
                    self.assertEqual(resolve_compiler(language, {name: str(override)}), str(override.resolve()))
                (root / "bin" / "gcc.exe").unlink()
                with self.assertRaisesRegex(FileNotFoundError, "内置编译器缺失"):
                    resolve_compiler("C", {})

    def test_source_mode_keeps_existing_path_behavior(self):
        with patch.dict(os.environ, {}, clear=True), patch("shutil.which", return_value="system-gcc"):
            self.assertEqual(resolve_compiler("C", {}), str(Path("system-gcc").resolve()))
            with self.assertRaisesRegex(FileNotFoundError, "编译器路径不存在"):
                resolve_compiler("C", {"gcc": "missing-custom-gcc.exe"})

    @unittest.skipUnless(os.name == "nt", "Windows short path aliases")
    def test_unicode_directory_uses_existing_ascii_alias_without_renaming_files(self):
        with tempfile.TemporaryDirectory(prefix="start-your-dsa-便携-") as temporary:
            directory = Path(temporary)
            source = directory / "main.c"
            source.touch()
            resolved = compiler_path(source)
            self.assertTrue(resolved.isascii())
            self.assertTrue(Path(resolved).samefile(source))
            output = compiler_path(directory / "program.exe")
            self.assertTrue(output.isascii())
            self.assertTrue(Path(output).parent.samefile(directory))
            for relative in ("bin", "lib/gcc/x86_64-w64-mingw32/15.2.0",
                             "libexec/gcc/x86_64-w64-mingw32/15.2.0", "x86_64-w64-mingw32/lib"):
                (directory / relative).mkdir(parents=True, exist_ok=True)
            compiler = directory / "bin" / "gcc.exe"
            compiler.touch()
            values = compiler_environment(compiler_path(compiler))
            self.assertEqual(set(values), {"GCC_EXEC_PREFIX", "COMPILER_PATH", "LIBRARY_PATH"})
            self.assertTrue(all(value.isascii() for value in values.values()))


if __name__ == "__main__":
    unittest.main()
