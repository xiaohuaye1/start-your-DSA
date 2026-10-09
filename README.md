# Start Your DSA

JavaScript + Electron 桌面界面，Python + GCC/G++ 本地判题，当前版本 0.2.0。

软件使用独立桌面窗口，HTML/CSS/JavaScript 是内部界面文件；不用浏览器打开。课程、笔记、草稿和学习进度由 Python 后端与 SQLite 管理。

## 启动

直接双击 **启动.bat** 启动新版。交付到桌面时已安装 Electron 和编辑器依赖；Python 后端需要 Python 3.11 或更高版本及 PySide6.QtCore。

重新安装依赖时，先安装 Node.js 22.12 或更新版本（包含 npm）和 Python，再双击 **安装依赖.bat**。安装脚本也支持本机已有的 pnpm。启动时优先使用项目内 `.venv`，否则使用 PATH 中安装了 PySide6 的 Python；可设置 `DSA_PYTHON` 指定解释器。

也可在项目根目录执行：

```powershell
python -m pip install -e .
npm install
npm start
```

代码练习额外需要 GCC/G++。如果 PATH 中找不到编译器，点击顶部“设置”，分别选择 `gcc.exe` 和 `g++.exe`。只看动画和阅读课程不需要编译器。

## 已实现

- 灰黑紧凑工作台：13px 正文和代码字号、18px 课程标题、图标导航、分组课程树、顶部三个环节切换。
- 动画右侧实时显示变量、操作记录、比较和交换次数；点击记录或选择轮次跳转，前进和回退同步更新状态。
- 下方面板提供当前步骤讲解、数组状态和完整课程原理；课程树中的灰色条目为待开放的课程规划。
- 冒泡排序三个环节：动画演示、实操训练、真题演练。
- JavaScript 数组动画：比较高亮、弧线交换移动、已归位标记、播放暂停、单步回退、进度跳转、调速、自定义数组。
- 独立练习页：题目、Ace C/C++ 编辑器、行号、语法高亮、自动缩进、撤销、折叠、参考代码。
- 本地编译一次、逐个运行测试：AC、WA、CE、TLE、RE、OLE、环境错误、停止任务；样例、自定义输入和完整提交。
- SQLite 自动保存草稿、课程笔记、提交记录和学习进度；重启恢复上次环节。
- 思维导图入口目前展示知识树；AI 入口目前支持整理和复制问题，未连接模型。

“真题演练”目前采用 [洛谷 P1177「排序」](https://www.luogu.com.cn/problem/P1177)，题意转述并标注原题来源。原题数据范围为 N≤100000、1≤a[i]≤1000000000，但本地只运行 3 个自建轻量用例，每组 4～6 个数，数值为 1～9。实操训练同样只运行 3 个用例，每组最多 8 个数；不提供大规模或极端数值的本地测试，每个用例本地限时 2 秒。点击“洛谷原题”可自行提交完整官方评测；本地 AC 只表示这些基础用例通过，不等同于洛谷官方评测结果。

真题演练的“输出 / 编译结果”采用终端样式：显示实际命令、编译器诊断和程序 stdout/stderr，不追加中文编译或判题摘要。程序自己输出的中文仍按原样保留；判题状态和实际/预期答案放在“测试用例”中。该区域由本地编译器提供输出，不需要安装 VS Code。

## 架构

```text
package.json                    JavaScript 桌面依赖
desktop/main.cjs                Electron 窗口与本地通信
desktop/preload.cjs             界面可调用的有限 API
desktop/backend.cjs             Python 子进程、请求与事件
desktop/index.html              新版页面结构
desktop/styles.css              新版界面样式
desktop/renderer.js             JavaScript 界面交互
desktop/algorithms.js           JavaScript 算法快照生成器
app/bridge.py                   本地 Python 服务
scripts/                        桌面启动与依赖安装脚本
app/models.py                   模块间的数据定义
app/judge/                      编译、执行、结果比较
app/courses/loader.py           读取 JSON、Markdown、测试文件
app/storage/                   SQLite 与设置
content/                       课程和题目资源
tests/                         算法、课程、存储、真实编译判题和界面测试
```

布局在 `desktop/index.html`，样式在 `desktop/styles.css`，交互在 `desktop/renderer.js`，动画步骤在 `desktop/algorithms.js`。

Electron 主进程启动 Python 服务，通过 stdin/stdout 的 JSON Lines 调用原判题、课程和 SQLite 模块。界面关闭前先保存，再取消正在运行的判题，最后结束后端。前端开启 contextIsolation、关闭 Node 集成，只通过 preload 暴露必要 API。课程 Markdown 用 DOMPurify 清理后显示；没有远程页面依赖。

二分查找已提供 JavaScript 步骤生成器，尚未加入课程目录；链表和树的图形与课程仍需实现。添加新课时，在 `content/catalog.json` 注册目录，在该目录放 `lesson.json`、讲解和题目。

每个动画步骤保存完整数组、比较位置、已归位位置、变量和解释。播放器控制时间，图形组件负责显示。练习中的任意 C/C++ 代码**不会自动转成动画**。

## 判题和进度

编译与运行由 QProcess 异步驱动。默认每个用例 2 秒，编译最多 20 秒，每个进程捕获输出上限 2 MiB（用于限制异常刷屏，并非测试规模）；当前没有内存限制。输出按空白分隔的 token 比较，终端显示上限为 4 MiB 字符。

样例通过不会完成课程；“提交判题”全部通过才完成实操/演练环节。动画到最后一步完成动画环节。本地判题只检查输出，不检测使用了哪种算法。更换真题后，旧题草稿与提交历史仍保存在原题 ID 下，完成标记按当前题目的提交记录计算。

这是运行自己代码的**本地练习工具**，没有安全沙箱。超时和临时目录不构成隔离，请只运行自己写的可信代码。课程中的完整测试文件可被查看，不是服务器秘密用例。

个人数据通过 QStandardPaths 放在系统应用数据目录，不写进课程安装目录。Windows 通常位于 `%APPDATA%/StartYourDSA/StartYourDSA/`，以软件“帮助”里显示的实际路径为准：

```text
learning.db      草稿、笔记、进度、提交记录（包含源代码）
settings.json    编译器路径、动画速度、上次打开的环节
```

## 验证

```powershell
python -m unittest discover -s tests -v
node --test tests/javascript.test.mjs
```

测试使用临时个人数据，不覆盖自己的学习进度。Python 编译测试需要 PATH 中存在 GCC/G++；未安装时会显示跳过。JavaScript 集成测试需要 GCC 和 PySide6。`tests/electron-smoke.cjs` 使用 Playwright 启动隐藏 Electron 窗口测试真正的界面，需通过 `DSA_PLAYWRIGHT` 指定已安装的 Playwright 模块路径，截图写入 `test-results/`。

## 后续开发

先增加数组、二分查找、链表等课程，再做可编辑思维导图和 AI 服务适配。在线 OJ、账号同步、安装器和自动更新需要后续实现。当前是桌面源码项目加已安装运行时，尚未制作可独立分发的安装包；Electron 正式打包还需处理 Python 服务和课程资源。

参考文档：[Electron 进程通信](https://www.electronjs.org/docs/latest/api/ipc-main)、[上下文隔离](https://www.electronjs.org/docs/latest/tutorial/context-isolation)、[QProcess](https://doc.qt.io/qtforpython-6/PySide6/QtCore/QProcess.html)。
