from pathlib import Path

root = Path(SPECPATH).parent
a = Analysis(
    [str(root / "packaging" / "backend_entry.py")],
    pathex=[str(root)],
    binaries=[],
    datas=[(str(root / "content"), "content")],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["PySide6.QtGui", "PySide6.QtWidgets", "tkinter", "pytest"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="DSABackend",
          debug=False, bootloader_ignore_signals=False, strip=False,
          upx=False, console=True)
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name="DSABackend")
