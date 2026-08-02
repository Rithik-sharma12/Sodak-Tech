"""Supported languages and how each is built and run inside the sandbox.

One registry, imported by both sides: the dispatcher validates against it and
the in-sandbox runner executes from it. Two copies would drift, and the failure
mode of that drift is a language that accepts submissions it cannot judge.

Reference timings depend on the toolchain, so the versions here are pinned by
the sandbox image rather than resolved at runtime -- SODAK-TECH-DESIGN.md §5.2
calls "latest compiler" a source of silent drift in reference timings.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Language:
    id: str
    name: str
    version: str
    filename: str

    # Run inside the sandbox before any test case. Empty means interpreted.
    compile_cmd: list[str] = field(default_factory=list)
    run_cmd: list[str] = field(default_factory=list)

    # The JVM reserves a large virtual address space at startup, so an
    # RLIMIT_AS ceiling kills it before main() runs. Memory is bounded by the
    # container limit and -Xmx instead. Everything else gets the rlimit.
    use_address_space_rlimit: bool = True

    monaco_id: str = "plaintext"


LANGUAGES: dict[str, Language] = {
    "python": Language(
        id="python",
        name="Python",
        version="3.11",
        filename="solution.py",
        # -I isolates from the environment: no site-packages, no PYTHON* vars,
        # no cwd on sys.path.
        run_cmd=["python3", "-I", "solution.py"],
        monaco_id="python",
    ),
    "cpp": Language(
        id="cpp",
        name="C++",
        version="GCC 12 / C++20",
        filename="solution.cpp",
        compile_cmd=["g++", "-std=c++20", "-O2", "-o", "solution", "solution.cpp"],
        run_cmd=["./solution"],
        monaco_id="cpp",
    ),
    "c": Language(
        id="c",
        name="C",
        version="GCC 12 / C17",
        filename="solution.c",
        compile_cmd=["gcc", "-std=c17", "-O2", "-o", "solution", "solution.c", "-lm"],
        run_cmd=["./solution"],
        monaco_id="c",
    ),
    "java": Language(
        id="java",
        name="Java",
        version="OpenJDK 17",
        filename="Main.java",
        compile_cmd=["javac", "-nowarn", "Main.java"],
        # Serial GC and a small heap keep a JVM inside a container limit that
        # is sized for native code.
        run_cmd=["java", "-XX:+UseSerialGC", "-Xss64m", "-Xms16m", "Main"],
        use_address_space_rlimit=False,
        monaco_id="java",
    ),
    "javascript": Language(
        id="javascript",
        name="JavaScript",
        version="Node 18",
        filename="solution.js",
        run_cmd=["node", "solution.js"],
        monaco_id="javascript",
    ),
}


def get(language_id: str) -> Language | None:
    return LANGUAGES.get(language_id)


def is_supported(language_id: str) -> bool:
    return language_id in LANGUAGES


def as_api_list() -> list[dict[str, str]]:
    """Shape the problem serializer hands to the editor's language picker."""
    return [
        {"id": lang.id, "name": lang.name, "version": lang.version, "monaco": lang.monaco_id}
        for lang in LANGUAGES.values()
    ]


__all__ = ["LANGUAGES", "Language", "as_api_list", "get", "is_supported"]
