"""Frozen console backend; Electron hides its window and uses its standard pipes."""
import ctypes
import os
import sys
from app.bridge import main

# PyInstaller's private DLL directory must not leak into GCC and user programs.
# QtCore and sqlite are already imported above. This does not modify system PATH.
if getattr(sys, "frozen", False) and os.name == "nt":
    ctypes.windll.kernel32.SetDllDirectoryW(None)

if __name__ == "__main__":
    sys.exit(main())
