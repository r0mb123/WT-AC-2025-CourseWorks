"""Prepare AI prompt for grading a student's work.

Usage: python prepare_AI_prompt.py --student <StudentDirectoryName> --task <taskN>

For курсовые проекты we don't have per-task rubrics like labs; we assemble a generic
prompt using README rubric and focus on student folder students/<NameLatin>/task_XX.
"""
from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parents[2]


def load_file(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _section_by_h2(md: str, header: str) -> str:
    """Extract a markdown section under an H2 header (## ...), until the next H2."""
    lines = md.splitlines()
    header_re = re.compile(rf"^##\s+{re.escape(header)}\s*$", re.IGNORECASE)
    start: Optional[int] = None
    for i, line in enumerate(lines):
        if header_re.match(line.strip()):
            start = i + 1
            break
    if start is None:
        return ""
    out: list[str] = []
    for line in lines[start:]:
        if re.match(r"^##\s+", line):
            break
        out.append(line)
    return "\n".join(out).strip()


def read_students_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def find_student_variant(students: list[dict], student_dir_name: str) -> str | None:
    for row in students:
        directory = (row.get("Directory") or "").replace("\\", "/").strip()
        last = Path(directory).name
        if last == student_dir_name or (row.get("NameLatin") or "") == student_dir_name:
            return (row.get("Вариант") or row.get("Variant") or row.get("Вариант ") or "").strip() or None
    return None


def _find_variant_header_regex(variant_num: int) -> re.Pattern[str]:
    # Accept both leading zero and non-zero forms.
    return re.compile(
        rf"^##\s+Вариант\s+(?:{variant_num:02d}|{variant_num})\s+—\s+(.+?)\s*$",
        re.MULTILINE,
    )


def extract_variant_block(variants_md: str, variant: str | None) -> tuple[str, str]:
    """Return (title, block_text) for the variant.

    block_text is everything after the variant H2 heading until the next H2 heading.
    """
    if not variant:
        return "", ""
    try:
        n = int(str(variant).strip())
    except Exception:
        return "", ""

    header_re = _find_variant_header_regex(n)
    m = header_re.search(variants_md)
    if not m:
        return "", ""

    title = m.group(1).strip()
    start = m.end()
    # Stop at next H2 header (any ## ...), i.e. next variant or next section.
    next_h2 = re.search(r"^##\s+", variants_md[start:], re.MULTILINE)
    end = start + next_h2.start() if next_h2 else len(variants_md)
    block = variants_md[start:end].strip()
    return title, block


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--student', required=True)
    ap.add_argument('--task', required=True, help='task_XX or number')
    args = ap.parse_args(argv)

    student = re.sub(r'[^A-Za-z0-9_-]', '', args.student)
    m = re.search(r'(\d+)', args.task)
    task_folder = f'task_{int(m.group(1)):02d}' if m else 'task_01'

    readme = load_file(ROOT / 'README.md')

    criteria = _section_by_h2(readme, 'Критерии оценивания')
    bonuses = _section_by_h2(readme, 'Опционально за доп. баллы (бонусы, суммарно до +50)')

    students_csv_path = ROOT / 'students' / 'students.csv'
    students = read_students_csv(students_csv_path) if students_csv_path.exists() else []
    variant = find_student_variant(students, student) or "(unknown)"
    variants_md = load_file(ROOT / 'Курсовые_работы_Веб_Технологии_Варианты_01-40.md')
    variant_title, variant_block = extract_variant_block(variants_md, variant)

    system_message = (
        "Ты строгий проверяющий курсовых проектов по веб-технологиям. "
        "Оценивай только по критериям и бонусам из README данного репозитория. "
        "Не выходи за рамки шаблона, не добавляй воды."
    )

    prompt = [
        "[System message для AI]:",
        system_message,
        "[Рекомендация: temperature=0.3 для консистентности]",
        "",
        "Оцени курсовой проект студента.",
        f"Смотреть файлы только в папке: ('students/{student}/{task_folder}').",
        f"Проверять только работу в папке: '{task_folder}'.",
        "Игнорируй бинарные и медиа-файлы (изображения/архивы/видео/аудио).",
        "",
        "Проверить соответствие варианту задания:",
    f"Вариант {variant}: {variant_title if variant_title else '(название варианта не найдено)'}",
    "Описание варианта (из файла вариантов):",
    variant_block if variant_block else "(описание варианта не найдено)",
    "",
    "Обязательная проверка темы vs варианта:",
    "- Найди и процитируй (1 короткой строкой) заявленную тему/домен проекта из README студента (внутри students/<NameLatin>/<task>/README.md и/или students/.../src/README.md, если есть).",
    "- Сравни заявленную тему/домен с данным вариантом (Pitch/MVP/API/Данные/Приёмка).",
    "- Если тема НЕ соответствует варианту: выставь 0/15 по критерию 'Архитектура и полнота требований' и явно напиши '(тема проекта не соответствует варианту)'.",
    "- Если тема соответствует: продолжай оценивание нормально.",
        "",
        "Критерии оценивания (из README):",
        criteria if criteria else "(Раздел 'Критерии оценивания' не найден в README)",
        "",
        "Бонусы (из README):",
        bonuses if bonuses else "(Раздел бонусов не найден в README)",
        "",
        "Требования к выводу:",
        "- Сначала выведи покритериальную таблицу (каждый критерий отдельной строкой с полученным баллом)",
        "- Затем строку: критерии: TOTAL / 50 (или другой базовый максимум, если явно указан в критериях)",
        "- Затем строку: бонусы: BONUS / 50 (если бонусы применимы)",
        "- Затем строку: Итого: TOTAL_WITH_BONUS / 100",
        "",
        "Пояснения:",
        "- Если по критерию получено меньше максимума, кратко (1 предложение) укажи причину снижения в скобках.",
        "- Если критерий на максимум — пояснение не требуется.",
        "",
        "Кратко предложи до 2 улучшений (по одному предложению).",
    ]

    print("\n".join(prompt))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
