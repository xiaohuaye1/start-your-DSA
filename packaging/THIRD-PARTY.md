# Third-party components

This package keeps third-party runtimes separate from application code.
Individual license texts are included alongside this notice and in toolchain/licenses.
Do not remove them when redistributing the package.

- Electron and its Chromium/Node.js dependencies: Electron LICENSE and LICENSES.chromium.html.
- Ace, DOMPurify and marked: original package license files in app.asar/node_modules.
- Python: PYTHON-LICENSE.txt.
- PySide6-Essentials / shiboken6 (Qt for Python): included wheel metadata and licenses.
  The shared Qt and Python DLLs are in resources/backend/_internal and may be replaced
  by compatible builds. The application does not forbid reverse engineering for
  debugging modifications to LGPL components.
- PyInstaller: included package metadata/licenses; bootloader exception applies.
- MinGW-Builds GCC 15.2.0, Binutils 2.45, MinGW-w64 v13 and related libraries:
  original build-info.txt and license texts are in resources/toolchain.

Upstream source and build information:

- https://github.com/electron/electron
- https://www.python.org/downloads/source/
- https://download.qt.io/official_releases/QtForPython/
- https://download.qt.io/official_releases/qt/
- https://github.com/pyinstaller/pyinstaller
- https://github.com/niXman/mingw-builds-binaries/releases/tag/15.2.0-rt_v13-rev0
- https://github.com/niXman/mingw-builds (build recipes and patches)
- https://ftp.gnu.org/gnu/gcc/gcc-15.2.0/gcc-15.2.0.tar.xz
- https://ftp.gnu.org/gnu/binutils/binutils-2.45.tar.xz

This locally generated build is unsigned. Before public distribution, review all
third-party licenses and make the exact corresponding sources, patches and build
recipes available alongside the binaries where required. A list of upstream links
alone is not a substitute for a GPL/LGPL source-distribution obligation.
