import shutil
from pathlib import Path


def resolve_compiler(language, settings):
    name = "gcc" if language == "C" else "g++"
    configured = str(settings.get(name, "")).strip()
    if configured:
        path = Path(configured)
        if path.is_file():
            return str(path.resolve())
        raise FileNotFoundError(f"编译器路径不存在：{configured}")
    result = shutil.which(name)
    if result:
        return result
    raise FileNotFoundError(f"未找到 {name}。请在设置中选择编译器，或把它加入 PATH。")


def arguments(source, executable, language):
    standard = "-std=c11" if language == "C" else "-std=c++17"
    return [standard, "-O0", "-Wall", "-Wextra", str(source), "-o", str(executable)]
