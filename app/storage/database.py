import sqlite3
from datetime import datetime
from pathlib import Path


class Database:
    def __init__(self, directory: Path):
        self.connection = sqlite3.connect(directory / "learning.db")
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS progress (lesson TEXT, stage TEXT, PRIMARY KEY(lesson, stage));
            CREATE TABLE IF NOT EXISTS notes (lesson TEXT PRIMARY KEY, text TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS drafts (problem TEXT, language TEXT, code TEXT NOT NULL,
                                               PRIMARY KEY(problem, language));
            CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY, problem TEXT, language TEXT,
                verdict TEXT, mode TEXT, code TEXT, created TEXT);
        """)

    def complete(self, lesson, stage):
        with self.connection:
            self.connection.execute("INSERT OR IGNORE INTO progress VALUES (?, ?)", (lesson, stage))

    def completed(self):
        return set(self.connection.execute("SELECT lesson, stage FROM progress"))

    def draft(self, problem, language):
        row = self.connection.execute("SELECT code FROM drafts WHERE problem=? AND language=?", (problem, language)).fetchone()
        return row[0] if row else None

    def save_draft(self, problem, language, code):
        with self.connection:
            self.connection.execute("INSERT OR REPLACE INTO drafts VALUES (?, ?, ?)", (problem, language, code))

    def note(self, lesson):
        row = self.connection.execute("SELECT text FROM notes WHERE lesson=?", (lesson,)).fetchone()
        return row[0] if row else ""

    def save_note(self, lesson, text):
        with self.connection:
            self.connection.execute("INSERT OR REPLACE INTO notes VALUES (?, ?)", (lesson, text))

    def submission(self, problem, language, verdict, mode, code):
        with self.connection:
            self.connection.execute("INSERT INTO submissions(problem,language,verdict,mode,code,created) VALUES (?,?,?,?,?,?)",
                                    (problem, language, verdict, mode, code, datetime.now().isoformat(timespec="seconds")))

    def recent_submissions(self, problem):
        return list(self.connection.execute("SELECT verdict,mode,created FROM submissions WHERE problem=? ORDER BY id DESC LIMIT 20", (problem,)))

    def has_accepted_submission(self, problem):
        return self.connection.execute(
            "SELECT 1 FROM submissions WHERE problem=? AND verdict='AC' AND mode='submit' LIMIT 1",
            (problem,)).fetchone() is not None

    def close(self):
        self.connection.close()
