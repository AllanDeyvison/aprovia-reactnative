"""Create a source ZIP without dependencies, generated files or real env files.

Usage: python scripts/source-zip.py
"""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import os

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"node_modules", ".expo", "dist", "web-build", ".git", "__pycache__"}


def allowed(path):
    return not any(
        part in EXCLUDED
        or (part.startswith(".env") and part != ".env.example")
        or part.lower().endswith((".zip", ".tsbuildinfo"))
        for part in path.parts
    )


if __name__ == "__main__":
    output = ROOT / "aprovia-reactnative-source.zip"
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for directory, dirs, files in os.walk(ROOT, followlinks=False):
            dirs[:] = [d for d in dirs if allowed(Path(d)) and not (Path(directory) / d).is_symlink()]
            for filename in sorted(files):
                source = Path(directory) / filename
                relative = source.relative_to(ROOT)
                if allowed(relative) and not source.is_symlink():
                    archive.write(source, Path(ROOT.name) / relative)
    with ZipFile(output) as archive:
        assert all(allowed(Path(item.filename)) for item in archive.infolist())
        assert archive.testzip() is None
        print(f"Created {output.name}: {len(archive.infolist())} files; exclusions verified.")
