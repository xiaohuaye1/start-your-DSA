import sys
from pathlib import Path
from PySide6.QtCore import QStandardPaths


ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))


def data_directory() -> Path:
    """安装目录可只读；个人数据放系统应用数据目录。"""
    path = Path(QStandardPaths.writableLocation(QStandardPaths.AppDataLocation))
    path.mkdir(parents=True, exist_ok=True)
    return path
