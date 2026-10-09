"""QProcess 事件驱动：编译一次，逐个测试；不阻塞窗口。"""
import os
import codecs
import shlex
import subprocess
import tempfile
from pathlib import Path
from PySide6.QtCore import QObject, QProcess, QProcessEnvironment, QTimer, QElapsedTimer, Signal
from app.models import JudgeResult, CaseResult
from app.judge.compiler import resolve_compiler, compiler_environment, arguments
from app.judge.checker import verdict


class JudgeRunner(QObject):
    log = Signal(str)
    terminal = Signal(object)
    case_finished = Signal(object)
    finished = Signal(object)
    OUTPUT_LIMIT = 2 * 1024 * 1024

    def __init__(self, settings, parent=None):
        super().__init__(parent)
        self.settings = settings
        self.busy = False
        self.process = QProcess(self)
        self.process.started.connect(self._started)
        self.process.readyReadStandardOutput.connect(self._read)
        self.process.readyReadStandardError.connect(self._read)
        self.process.finished.connect(self._exited)
        self.process.errorOccurred.connect(self._error)
        self.timer = QTimer(self)
        self.timer.setSingleShot(True)
        self.timer.timeout.connect(lambda: self._stop("TLE" if self.phase == "run" else "COMPILE_TIMEOUT"))
        self.clock = QElapsedTimer()
        self.temporary = None

    def start(self, code, language, cases, time_limit_ms=2000):
        if self.busy:
            raise RuntimeError("已有任务在运行")
        self.cases = list(cases)
        if not self.cases:
            self.finished.emit(JudgeResult("ENV", "题目没有测试用例"))
            return
        self.busy = True
        self.results = []
        self.index = 0
        self.time_limit_ms = max(100, int(time_limit_ms))
        try:
            compiler = resolve_compiler(language, self.settings)
            self.temporary = tempfile.TemporaryDirectory(prefix="start-your-dsa-")
            directory = Path(self.temporary.name)
            source = directory / ("main.c" if language == "C" else "main.cpp")
            source.write_text(code, encoding="utf-8")
            self.executable = directory / ("program.exe" if os.name == "nt" else "program")
            environment = QProcessEnvironment.systemEnvironment()
            environment.insert("PATH", str(Path(compiler).parent) + os.pathsep + environment.value("PATH"))
            for key, value in compiler_environment(compiler).items():
                environment.insert(key, value)
            self.environment = environment
            self.process.setWorkingDirectory(str(directory))
            self.log.emit(f"编译：{compiler}（{language}）")
            self._launch("compile", compiler, arguments(source, self.executable, language), 20000)
        except (OSError, ValueError) as error:
            self._finish("ENV", str(error))

    def _launch(self, phase, program, args, timeout):
        self.phase = phase
        self.stop_reason = ""
        self.stdout = bytearray()
        self.stderr = bytearray()
        self.out_decoder = codecs.getincrementaldecoder("utf-8")(errors="replace")
        self.err_decoder = codecs.getincrementaldecoder("utf-8")(errors="replace")
        environment = QProcessEnvironment(self.environment)
        if phase == "compile":
            environment.insert("LC_ALL", "C")
            environment.insert("LANG", "C")
        self.process.setProcessEnvironment(environment)
        command = subprocess.list2cmdline([program, *args]) if os.name == "nt" else shlex.join([program, *args])
        self.terminal.emit({"kind": "command", "phase": phase, "text": "$ " + command + "\n"})
        self.clock.start()
        self.timer.start(timeout)
        self.process.start(program, args)

    def _started(self):
        if self.phase == "run":
            self.process.write(self.cases[self.index].input.encode("utf-8"))
        self.process.closeWriteChannel()

    def _read(self):
        remaining = self.OUTPUT_LIMIT - len(self.stdout) - len(self.stderr)
        # 即使超限也排空 Qt 缓冲，避免不断积累；保存内容受 OUTPUT_LIMIT 限制。
        out = bytes(self.process.readAllStandardOutput())
        err = bytes(self.process.readAllStandardError())
        overflow = len(out) + len(err) > remaining
        kept_out = out[:max(0, remaining)]
        self.stdout.extend(kept_out)
        remaining -= len(out)
        kept_err = err[:max(0, remaining)]
        self.stderr.extend(kept_err)
        self._terminal_text("stdout", self.out_decoder.decode(kept_out))
        self._terminal_text("stderr", self.err_decoder.decode(kept_err))
        if overflow:
            self._stop("OLE")

    def _terminal_text(self, channel, text):
        if text:
            self.terminal.emit({"kind": "output", "phase": self.phase, "channel": channel, "text": text})

    def _stop(self, reason):
        if self.busy and not self.stop_reason:
            self.stop_reason = reason
            self.process.kill()

    def cancel(self):
        self._stop("CANCELLED")

    def _error(self, error):
        if self.busy and error == QProcess.FailedToStart:
            self._finish("ENV", "进程启动失败：" + self.process.errorString())

    def _exited(self, code, status):
        if not self.busy:
            return
        self.timer.stop()
        self._read()
        self._terminal_text("stdout", self.out_decoder.decode(b"", final=True))
        self._terminal_text("stderr", self.err_decoder.decode(b"", final=True))
        out = self.stdout.decode("utf-8", errors="replace")
        err = self.stderr.decode("utf-8", errors="replace")
        if self.stop_reason == "CANCELLED":
            self._finish("CANCELLED", "任务已停止")
            return
        if self.phase == "compile":
            if self.stop_reason or code != 0 or status == QProcess.CrashExit:
                self._finish("CE", self.stop_reason or err or out or "编译失败")
            else:
                self.log.emit("编译成功" + ("\n" + err if err else ""))
                self._next_case()
            return
        case = self.cases[self.index]
        result = self.stop_reason or ("RE" if code != 0 or status == QProcess.CrashExit else verdict(out, case.expected))
        item = CaseResult(case.name, result, out, case.expected, err, self.clock.elapsed())
        self.results.append(item)
        self.case_finished.emit(item)
        self.index += 1
        if self.index < len(self.cases):
            self._next_case()
        else:
            overall = next((r.verdict for r in self.results if r.verdict not in ("AC", "RUN")),
                           "AC" if all(r.verdict == "AC" for r in self.results) else "RUN")
            passed = sum(r.verdict == "AC" for r in self.results)
            self._finish(overall, f"测试结束：{passed}/{len(self.results)} 通过" if overall != "RUN" else "自定义输入运行结束")

    def _next_case(self):
        self.log.emit(f"测试 {self.index+1}/{len(self.cases)}：{self.cases[self.index].name}")
        self._launch("run", str(self.executable), [], self.time_limit_ms)

    def _finish(self, result, message):
        self.timer.stop()
        self.busy = False
        temporary, self.temporary = self.temporary, None
        if temporary:
            try:
                temporary.cleanup()
            except OSError:
                message += "\n临时目录未能清理，系统可能仍占用可执行文件。"
        self.finished.emit(JudgeResult(result, message, tuple(getattr(self, "results", []))))
