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
- 下方面板提供当前步骤讲解、数组状态和完整课程原理；课表 28 个条目均已开放。
- 冒泡排序三个环节：动画演示、实操训练、真题演练。
- 已开放 28 节，每节同样包含独立动画、思路讲解、C/C++ 模板、参考代码、轻量判题和洛谷真题。
- JavaScript 数组动画：比较高亮、弧线交换移动、已归位标记、播放暂停、单步回退、进度跳转、调速、自定义数组。
- 独立练习页：题目、Ace C/C++ 编辑器、行号、语法高亮、自动缩进、撤销、折叠、参考代码。
- 本地编译一次、逐个运行测试：AC、WA、CE、TLE、RE、OLE、环境错误、停止任务；样例、自定义输入和完整提交。
- SQLite 自动保存草稿、课程笔记、提交记录和学习进度；重启恢复上次环节。
- 思维导图入口目前展示知识树；AI 入口目前支持整理和复制问题，未连接模型。

冒泡排序的“真题演练”采用 [洛谷 P1177「排序」](https://www.luogu.com.cn/problem/P1177)，题意转述并标注原题来源。原题数据范围为 N≤100000、1≤a[i]≤1000000000，但本地只运行 3 个自建轻量用例，每组 4～6 个数，数值为 1～9。实操训练同样只运行 3 个用例，每组最多 8 个数；不提供大规模或极端数值的本地测试，每个用例本地限时 2 秒。点击“洛谷原题”可自行提交完整官方评测；本地 AC 只表示这些基础用例通过，不等同于洛谷官方评测结果。

真题演练的“输出 / 编译结果”采用终端样式：显示实际命令、编译器诊断和程序 stdout/stderr，不追加中文编译或判题摘要。程序自己输出的中文仍按原样保留；判题状态和实际/预期答案放在“测试用例”中。该区域由本地编译器提供输出，不需要安装 VS Code。

## 当前课程

课表共 28 个条目，全部开放，共 28 节、84 个学习环节。第 24 节图的遍历保持原有实现，第 25～28 节补齐哈希表、贪心算法、动态规划和综合训练。课程是一套入门案例，不代表涵盖这些主题的所有算法。

| 课程 | 动画 | 实操 | 洛谷真题 |
| --- | --- | --- | --- |
| 算法与复杂度 | 遍历、累计总和与访问次数 | 数组求和 | [P1001 A+B Problem](https://www.luogu.com.cn/problem/P1001) |
| 数据结构简介 | 栈入栈、出栈及逆序输出 | 原地反转序列 | [P1427 小鱼的数字游戏](https://www.luogu.com.cn/problem/P1427) |
| 算法分析 | 单层与双层循环、n 与 n² 计数 | 统计有序下标对 | [P1035 级数求和](https://www.luogu.com.cn/problem/P1035) |
| 结构体回顾与学习 | Student 字段比较与整条记录复制 | 最高分学生、同分按学号 | [P1093 奖学金](https://www.luogu.com.cn/problem/P1093) |
| 数组 | 下标定位、单项更新及地址示意 | 修改指定下标 | [P1428 小鱼比可爱](https://www.luogu.com.cn/problem/P1428) |
| 链表 | 沿 next 遍历、分步插入和删除 | 用 C 节点指针插入 | [B3631 单向链表](https://www.luogu.com.cn/problem/B3631) |
| 循环链表 | 固定报 2 出圈、尾部回到 head | 移动起点、输出恰好一圈 | [P1996 约瑟夫问题](https://www.luogu.com.cn/problem/P1996) |
| 双向链表 | 反向遍历、分步修复 next/prev | 删除后正向和反向输出 | [P1160 队列安排](https://www.luogu.com.cn/problem/P1160) |
| 栈 | 混合 push/peek/pop | 栈操作命令 | [P1739 表达式括号匹配](https://www.luogu.com.cn/problem/P1739) |
| 队列 | 普通顺序队列、front/rear 与 FIFO | 队列操作命令 | [P1540 机器翻译](https://www.luogu.com.cn/problem/P1540) |
| 循环队列 | 取模回绕、count 区分空满、有效槽位 | 空满拒绝与混合操作 | [P1996 约瑟夫问题](https://www.luogu.com.cn/problem/P1996)，循环队列解法 |
| 排序算法概述 | 带原编号记录的稳定性对比 | 检查非降序，不修改输入 | [P1059 明明的随机数](https://www.luogu.com.cn/problem/P1059) |
| 冒泡排序 | 相邻比较与交换 | 补全排序 | [P1177 排序](https://www.luogu.com.cn/problem/P1177) |
| 选择排序 | 扫描最小下标、一次交换、归位 | 补全选择排序 | [P5715 三位数排序](https://www.luogu.com.cn/problem/P5715) |
| 插入排序 | key 暂存、空位、大值右移、填回 | 补全插入排序 | [P1152 欢乐的跳](https://www.luogu.com.cn/problem/P1152) |
| 快速排序 | 三向分区、固定 pivot 值、待处理区间 | 补全三向快速排序 | [P1177 排序](https://www.luogu.com.cn/problem/P1177)，快速排序解法 |
| 归并排序 | 拆分、稳定缓冲区合并、复制回原区间 | 补全归并排序 | [P1177 排序](https://www.luogu.com.cn/problem/P1177)，归并解法 |
| 堆排序 | 大根堆、下沉、有效堆与有序后缀 | 补全下沉与堆排序 | [P1177 排序](https://www.luogu.com.cn/problem/P1177)，堆排序解法 |
| 二分查找 | 半开区间、重复值首次位置、未找到 | 多次查找首次编号 | [P2249 查找](https://www.luogu.com.cn/problem/P2249) |
| 二叉树 | 节点连线与前序、中序、后序 | 按孩子编号前序遍历 | [P1305 新二叉树](https://www.luogu.com.cn/problem/P1305) |
| 平衡二叉树 | AVL 插入、回溯高度、四类旋转 | 补全 AVL 修复 | [P3369 普通平衡树](https://www.luogu.com.cn/problem/P3369)，六种可重集合操作 |
| 堆 | 动态小根堆插入、peek、删除 | 补全上浮与下沉 | [P3378 堆](https://www.luogu.com.cn/problem/P3378) |
| 图的基础 | 无向图连线、矩阵、邻接关系、度数 | 统计度数 | [B3643 图的存储](https://www.luogu.com.cn/problem/B3643) |
| 图的遍历 | 有向图 DFS 路径与 BFS 队列、防环 | 补全 DFS | [P5318 查找文献](https://www.luogu.com.cn/problem/P5318) |
| 哈希表 | 容量 11 线性探测、冲突、重复计数、DEL 后查询 | 补全查找 / 插入槽位 | [P3370 字符串哈希](https://www.luogu.com.cn/problem/P3370)，链式桶与原串核对 |
| 贪心算法 | 按结束时间排序、区间兼容与跳过 | 最大不重叠活动数 | [P1803 线段覆盖](https://www.luogu.com.cn/problem/P1803) |
| 动态规划 | 0/1 背包逆序容量、前一行来源与回溯 | 补全一维背包转移 | [P1048 采药](https://www.luogu.com.cn/problem/P1048) |
| 数据结构综合训练 | 小根堆取两项、合并、回插与累计 | 组合堆操作完成最优合并 | [P1090 合并果子](https://www.luogu.com.cn/problem/P1090) |

新增动画每次最多 8 个元素，支持生成演示、单步、回退、播放暂停、调速和进度跳转。单步同步更新变量、操作记录、代码语句及辅助场景；数组地址、结构体字段、链表节点编号仅为教学示意，不声称是编译程序的真实内存。链表卡片显示 next/prev、暂未接入和已摘除状态，环形路径明确回到起点。练习代码仍不会自动转成动画。

每个实操或真题只有 3 个自建小用例。P1035 仅测试 k=1,2,3，P1093 仅测试 5～7 人，其余新练习仅使用短序列或普通小整数；不测试官方最大输入。官方约束保留在题目说明中，完整评测由用户自行到洛谷提交。新增题意、样例和参考代码为本项目编写，不复制洛谷题解。

第 6～10 节真题只用短指令、4～6 人/词或短括号表达式。P1160 包含左右插入和重复删除，并非普通 FIFO 题；P1540 缓存命中不重排，不是 LRU。动画的循环链表固定报 2，练习真题支持输入 m。普通队列不循环复用存储，循环队列一课单独展示取模回绕。

本批新增循环队列、排序概述、选择排序、插入排序、快速排序。P1996 和 P1177 分别与原课程复用原题，练习实现不同，草稿、提交及进度按课程题目 ID 独立保存。新用例仅短操作或 3～7 个普通小整数；P1152 只用短序列。选择排序与快速排序实操不默认去重，只有 P1059 明确要求去重。输出仍为编译器与程序的原始文本。

快速排序演示和参考代码均采用三向分区。动画以任务栈优先处理较小区间，C 参考代码只递归较小侧、循环处理较大侧；这是两种控制流程，不是逐行执行用户提交的代码。三向分区适合重复值，但平均 O(n log n) 不代表最坏情况保证。

第 25～28 节同样各有独立动画、实操与洛谷真题。哈希整数动画采用线性探测，字符串真题用链式桶，并比较完整字符串避免“同哈希就相等”。实操指令最多 8 个有效不同键，容量 11；删除用 DEL，查找不会把后续冲突键丢掉。复杂度是适当分布下的预期 O(1)，并非最坏保证。

贪心动画输入是正整数时长，起点固定为 2*id；按最早结束选最大数量，实操支持明确区间。动态规划是 0/1 背包：容量固定 6，重量循环 1/2/3，输入为价值；逐格显示上一物品来源、逆序容量及最终选择。实操 / 真题可自行输入容量、重量和价值，两者第一行顺序不同，题面已注明。

综合训练使用小根堆与贪心完成最优合并，每轮取最小两项、新重量回插，显示单轮与累计代价。与前面的动态堆操作课不同，重点是完整解题流程。贪心、背包和最优合并的动画只接受正整数，哈希动画允许负整数。每题仍仅 3 个短用例；字符串只用 4～6 个短词，区间 4～5 场，背包 3～4 件与容量 4～6，合并果子仅 3～5 堆。实操一堆的基本边界输出 0。

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
desktop/learning-demos.js       前五节的教学快照、代码示意与知识树
desktop/linear-demos.js         第6～10节的链表、栈与队列完整状态快照
desktop/sorting-demos.js        循环队列、稳定性对比及三种排序的教学快照
desktop/advanced-demos.js       第17～24节排序、查找、树、堆与图快照
desktop/final-demos.js          第25～28节哈希、贪心、背包和最优合并快照
desktop/structure-scenes.js     按节点ID绘制树和有向/无向图
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

第 16 节快速排序保留，第 17～24 节全部开放。新增树与图使用原生 SVG 连线；二叉树动画采用层序构造的示例完全二叉树，实操支持指定孩子。图动画用固定教学连接，输入只是标签，编号决定连线和访问顺序；不是任意图编辑器。AVL 动画演示插入及四类旋转，真题参考代码完整支持插入、删除一份、排名、第 k 小、严格前驱和严格后继。图遍历真题参考代码使用邻接结构及显式 DFS 栈，避免大规模递归深度问题。添加新课时，在 `content/catalog.json` 注册目录，在该目录放 `lesson.json`、讲解和题目。小测试可内嵌在 problem.json 的 input/expected 字段，也兼容原先的 .in/.out 文件。

每个动画步骤保存完整数组、比较位置、已归位位置、变量和解释。播放器控制时间，图形组件负责显示。较矮窗口下，树、图和最后四节会收起顶部重复数组行，原数组仍可在辅助演示区查看，为节点、连线和状态表留出空间。练习中的任意 C/C++ 代码**不会自动转成动画**。

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
node --test tests/javascript.test.mjs tests/advanced.test.mjs tests/final.test.mjs
```

测试使用临时个人数据，不覆盖自己的学习进度。Python 编译测试需要 PATH 中存在 GCC/G++；未安装时会显示跳过。JavaScript 集成测试需要 GCC 和 PySide6。`tests/electron-smoke.cjs` 使用 Playwright 启动隐藏 Electron 窗口测试真正的界面，需通过 `DSA_PLAYWRIGHT` 指定已安装的 Playwright 模块路径，截图写入 `test-results/`。

`node tests/learning-smoke.cjs` 逐节验证前五节的真实界面、动画回退、独立草稿和笔记、原始输出、轻量用例及小窗口布局。后端测试同时编译新参考代码的 C/C++ 版本，并检查练习模板可编译。

`node tests/linear-smoke.cjs` 同样验证第 6～10 节，测试过程中使用隔离的个人数据。所有开放课程都参与课程资源检查，新增题目同时通过独立的小输入答案计算进行核对。

`node tests/sorting-smoke.cjs` 验证本批新增五节的实际界面，包含循环队列空满、插入空位、三个环节、独立笔记和草稿、三用例判题、原始输出及小窗口。JavaScript 测试还验证元素保留、稳定性和每一帧三向分区不变量。

`node tests/advanced-smoke.cjs` 验证第 17～24 节真实窗口、单步回退、三个环节、独立笔记与草稿、三用例编译判题、原始终端输出以及小窗口。`tests/advanced.test.mjs` 检查稳定合并、有效堆、首次位置、AVL 高度与平衡、动态最小值和图的可达遍历。Python 独立答案计算不依赖参考程序输出。

本地短用例只校验基本输出；无法证明复杂度或强制使用指定算法。新增题目仍每题 3 个普通短用例，不跑官方最大数据。复用同一洛谷题的课程有不同题目 ID，草稿和进度互不覆盖。

`node tests/final-smoke.cjs` 验证第 25～28 节实际窗口、单步 / 回退、笔记草稿、样例与正式提交、原始终端输出和最小窗口。`tests/final.test.mjs` 验证碰撞及 DEL 查询、区间选择最优性、0/1 背包来源与回溯、合并中的堆序及重量守恒。Python 用字典、子集枚举与所有短合并方案独立核对答案，而不是从参考程序产生预期输出。`npm test` 包含全部三份 JavaScript 测试。

## 后续开发

后续可增加更多案例、可编辑思维导图和 AI 服务适配。在线 OJ、账号同步、安装器和自动更新需要后续实现。当前是桌面源码项目加已安装运行时，尚未制作可独立分发的安装包；Electron 正式打包还需处理 Python 服务和课程资源。

参考文档：[Electron 进程通信](https://www.electronjs.org/docs/latest/api/ipc-main)、[上下文隔离](https://www.electronjs.org/docs/latest/tutorial/context-isolation)、[QProcess](https://doc.qt.io/qtforpython-6/PySide6/QtCore/QProcess.html)。
