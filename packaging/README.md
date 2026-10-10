# Windows 打包

用户下载便携 ZIP，全部解压后双击 Start Your DSA.exe 即可，不需要配置运行环境和编译器。
此目录里的工具只给开发者用。

## 开发者首次准备

```powershell
npm install
python -m venv .build-venv
.build-venv/Scripts/python.exe -m pip install -r packaging/requirements.txt
npm install --prefix packaging/tooling
$env:DSA_BUILD_TOOLCHAIN = 'D:/你的路径/mingw64'
npm run pack:win
```

工具链需要完整的 bin、include、lib、libexec、x86_64-w64-mingw32、licenses
和 build-info.txt，不能只复制 gcc.exe。当前打包脚本适配 MinGW-Builds
GCC 15.2.0 / x64 / POSIX / SEH / UCRT，其他发行版需要调整文件清单并测试。

生成文件在 `release/`：

- `Start-Your-DSA-0.2.2-win-x64.zip`：免安装，全部解压后双击目录里的 `Start Your DSA.exe`。
- `win-unpacked/`：解压版目录，里面也能直接双击 `Start Your DSA.exe`。

默认发布 ZIP，不再生成每次启动都自解压的单文件 EXE。
ZIP 只需手动解压一次，必须保留整个目录，不能只复制主 EXE。
个人笔记、草稿和进度仍保存到系统应用数据目录，
不会放在软件目录中；这与“数据也放 U 盘”的全便携模式不同。

生成的 EXE 暂未数字签名。公开发布前请检查第三方许可证，并按要求提供
对应源码、补丁和构建说明，详见 `THIRD-PARTY.md`。

中文目录会自动尝试使用 Windows 现有短路径，并为编译器指定内部搜索目录。
如果所在磁盘关闭了短文件名、或整个路径仍包含非 ASCII 字符，需要把软件
和临时目录放到英文路径；程序不会修改磁盘设置或系统区域设置。

开发说明参考：[Electron 资源打包](https://www.electron.build/docs/contents/)、
[PyInstaller spec 文件](https://pyinstaller.org/en/stable/spec-files.html)。
