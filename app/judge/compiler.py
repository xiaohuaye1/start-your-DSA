import os
import shutil
import ctypes
from pathlib import Path


def compiler_path(path):
    """MinGW's narrow-character linker needs ASCII paths on Windows.

    Use the OS's existing short path alias; do not rename files, enable short
    names on a volume, change system locale, or modify the installed compiler.
    For a not-yet-created output file, shorten its existing parent directory.
    """
    path = Path(path).resolve()
    text = str(path)
    if os.name != "nt" or text.isascii():
        return text
    directory = path if path.is_dir() else path.parent
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.GetShortPathNameW.argtypes = [ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_ulong]
    kernel.GetShortPathNameW.restype = ctypes.c_ulong
    buffer = ctypes.create_unicode_buffer(32768)
    length = kernel.GetShortPathNameW(str(directory), buffer, len(buffer))
    if not length or length >= len(buffer) or not buffer.value.isascii():
        raise ValueError("编译器不支持当前中文路径，且系统没有可用短路径。请将软件和临时目录放在英文路径。")
    return buffer.value if path.is_dir() else str(Path(buffer.value) / path.name)


def resolve_compiler(language, settings):
    name = "gcc" if language == "C" else "g++"
    bundled_root = os.environ.get("DSA_TOOLCHAIN")
    bundled = Path(bundled_root) / "bin" / (name + ".exe") if bundled_root else None
    configured = str(settings.get(name, "")).strip()
    if configured:
        path = Path(configured)
        if path.is_file():
            return compiler_path(path)
        if bundled is None or not bundled.is_file():
            raise FileNotFoundError(f"编译器路径不存在：{configured}")
    if bundled is not None:
        if bundled.is_file():
            return compiler_path(bundled)
        raise FileNotFoundError("内置编译器缺失，请重新解压或下载完整软件包。")
    result = shutil.which(name)
    if result:
        return compiler_path(result)
    raise FileNotFoundError(f"未找到 {name}。请在设置中选择编译器，或把它加入 PATH。")


def compiler_environment(compiler):
    """Explicit prefixes stop GCC from expanding ASCII aliases back to Unicode."""
    if os.name != "nt":
        return {}
    root = Path(compiler).parent.parent
    target = root / "x86_64-w64-mingw32"
    versions = list((root / "lib" / "gcc").glob("*/*"))
    executables = list((root / "libexec" / "gcc").glob("*/*"))
    if not target.is_dir() or not versions or not executables:
        return {}
    root = Path(compiler_path(root))
    versions = [path for path in (root / "lib" / "gcc").glob("*/*") if path.is_dir()]
    executables = [path for path in (root / "libexec" / "gcc").glob("*/*") if path.is_dir()]
    target = root / "x86_64-w64-mingw32"
    return {
        "GCC_EXEC_PREFIX": str(root / "lib" / "gcc") + os.sep,
        "COMPILER_PATH": os.pathsep.join(str(path) for path in [*executables, target / "bin"]),
        "LIBRARY_PATH": os.pathsep.join(str(path) for path in [*versions, target / "lib"]),
    }


def arguments(source, executable, language):
    standard = "-std=c11" if language == "C" else "-std=c++17"
    return [standard, "-O0", "-Wall", "-Wextra", compiler_path(source), "-o", compiler_path(executable)]
