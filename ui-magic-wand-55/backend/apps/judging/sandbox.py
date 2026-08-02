"""Runs a submission inside a throwaway container. Zone 2 side of the boundary.

This module holds the container runtime socket, and SODAK-TECH-STACK.md §5.4 is
blunt about what that is worth: "The container runtime socket is never
reachable from anything that runs untrusted code. Access to it is equivalent to
host root and is the most common way self-built judges are compromised."

The rule is honoured by keeping the socket and the untrusted code on opposite
sides of a boundary:

    dispatcher (this module)      sandbox container
    ----------------------        -----------------
    holds the socket              no socket
    holds database credentials    no credentials, empty environment
    holds expected outputs        inputs only
    runs no submitted code        runs nothing else

So the process that can create containers never executes a learner's program,
and the process that executes it cannot create containers. The socket must
therefore never be mounted into the sandbox image, and the dispatcher must
never gain an eval path. Both are load-bearing.

Two independent boundaries contain a submission, per §2.4:

  1. The container: no network, dropped capabilities, no privilege escalation,
     read-only root, cgroup memory and CPU ceilings, a PID ceiling.
  2. Kernel rlimits applied per process inside it, by judge/runner.py.

Neither is gVisor or Kata, which §2.4 asks for and which a hosted deployment
should add underneath this. Stated plainly rather than implied: this contains
the ordinary hostile submission -- fork bombs, memory bombs, runaway loops,
attempts to reach the network or the filesystem. It is not a defence against a
kernel exploit, because it shares the host kernel.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass
from socket import SHUT_WR
from typing import Any

from django.conf import settings

from apps.judging import languages

logger = logging.getLogger("sodak.judge")


class SandboxUnavailable(RuntimeError):
    """The runtime could not be reached. Distinct from a submission failing.

    Kept separate so an infrastructure outage is retried rather than reported
    to the learner as a wrong answer -- §4.8 wants a degraded mode, and telling
    someone their correct program was rejected is worse than telling them the
    judge is busy.
    """


@dataclass
class CaseOutcome:
    id: str
    status: str
    stdout: str
    stderr: str
    runtime_ms: int
    memory_kb: int


@dataclass
class SandboxResult:
    compiled: bool
    compile_output: str
    cases: list[CaseOutcome]


def _client():
    try:
        import docker
    except ImportError as exc:  # pragma: no cover - dependency is pinned
        raise SandboxUnavailable(
            "The docker SDK is not installed in this image."
        ) from exc

    try:
        return docker.DockerClient(
            base_url=settings.JUDGE_DOCKER_HOST, timeout=settings.JUDGE_DOCKER_TIMEOUT
        )
    except Exception as exc:  # noqa: BLE001 - the SDK raises several types here
        raise SandboxUnavailable(f"Cannot reach the container runtime: {exc}") from exc


def _attach_stdin(container):
    """Open the container's stdin. Must be called before it is started.

    Attaching after start races the runner's first read: the stream is not
    connected yet, the runner sees EOF on an empty stdin, and the container
    then sits doing nothing until its deadline. Docker's own `run -i` attaches
    first for the same reason.
    """
    return container.attach_socket(
        params={"stdin": 1, "stream": 1, "stdout": 0, "stderr": 0}
    )


def _write_job(socket_wrapper, job: dict[str, Any]) -> None:
    """Send the job to the runner over the attached stdin.

    Not an argument and not an environment variable: both are readable from the
    process list by anything else in the container, and both have length limits
    a large test input would exceed. Not a file either -- the root filesystem is
    read-only, which the runtime enforces against writes from outside too, so
    there is nowhere to place one before the process starts.

    The write side is shut down afterwards so the runner sees EOF; without it
    the runner blocks on a read that never returns.
    """
    payload = json.dumps(job).encode("utf-8")

    raw = getattr(socket_wrapper, "_sock", socket_wrapper)
    try:
        raw.sendall(payload)
        raw.shutdown(SHUT_WR)
    finally:
        try:
            socket_wrapper.close()
        except Exception:  # noqa: BLE001, S110 - best effort
            pass


def run_submission(
    *,
    source: str,
    language_id: str,
    inputs: list[tuple[str, str]],
    time_limit_ms: int,
    memory_limit_mb: int,
) -> SandboxResult:
    """Execute `source` against `inputs` and report what each run produced.

    `inputs` is a list of (case_id, stdin). Expected outputs are not a
    parameter, and that is the point -- see the module docstring.
    """
    language = languages.get(language_id)
    if language is None:
        raise SandboxUnavailable(f"Unsupported language {language_id!r}.")

    job = {
        "source": source,
        "filename": language.filename,
        "compile_cmd": language.compile_cmd,
        "run_cmd": language.run_cmd,
        "time_limit_ms": time_limit_ms,
        "memory_limit_mb": memory_limit_mb,
        "use_address_space_rlimit": language.use_address_space_rlimit,
        "cases": [{"id": case_id, "input": stdin} for case_id, stdin in inputs],
    }

    # Bound the whole container: per-case limits are enforced inside, but a
    # runner that wedges must not hold a worker slot indefinitely (§4.2).
    overall_deadline = min(
        settings.JUDGE_CONTAINER_TIMEOUT,
        20 + (len(inputs) * ((time_limit_ms // 1000) + 3)),
    )

    client = _client()
    container = None
    name = f"sodak-judge-{uuid.uuid4().hex[:12]}"

    try:
        try:
            container = client.containers.create(
                image=settings.JUDGE_SANDBOX_IMAGE,
                name=name,
                command=["python3", "-I", "/opt/runner.py"],
                # The runner reads its job from stdin; without this there is no
                # stream to attach to and it sees EOF immediately.
                stdin_open=True,
                # No TTY, so stdout and stderr stay separable in the log
                # stream. With one the two interleave and the result JSON is
                # corrupted by anything the program wrote to stderr.
                tty=False,
                # No route to anything. Not a firewall rule that can be
                # misconfigured -- the container has no network interface.
                network_disabled=True,
                network_mode="none",
                # Nothing to inherit. No DATABASE_URL, no broker URL, no keys.
                environment={},
                user="65532:65532",
                working_dir="/box",
                read_only=True,
                # The only writable surface, and it does not survive the
                # container. exec is required because compiled languages
                # produce a binary here.
                tmpfs={
                    "/box": f"rw,exec,size={settings.JUDGE_TMPFS_MB}m,mode=1777",
                    "/tmp": "rw,noexec,nosuid,size=16m,mode=1777",  # noqa: S108
                },
                mem_limit=f"{memory_limit_mb + settings.JUDGE_MEMORY_HEADROOM_MB}m",
                # Equal to mem_limit disables swap: without this a memory bomb
                # is absorbed by swap and reported as a timeout instead.
                memswap_limit=f"{memory_limit_mb + settings.JUDGE_MEMORY_HEADROOM_MB}m",
                # A fork bomb hits this ceiling instead of the host's.
                pids_limit=settings.JUDGE_PIDS_LIMIT,
                nano_cpus=int(settings.JUDGE_CPU_LIMIT * 1e9),
                cap_drop=["ALL"],
                security_opt=["no-new-privileges:true"],
                # Submitted code cannot gain privileges its parent lacks, so a
                # setuid binary in the image is not a path out.
                privileged=False,
                # No `detach` here: it belongs to containers.run(), and
                # containers.create() forwards it into the container config
                # where it overrides the attach settings. The result is a
                # container whose stdin is never connected -- the runner blocks
                # on an empty read and the job times out with no output.
            )
        except Exception as exc:  # noqa: BLE001 - SDK raises APIError/ImageNotFound
            raise SandboxUnavailable(
                f"Could not create the sandbox container: {exc}"
            ) from exc

        stdin_socket = _attach_stdin(container)
        container.start()
        _write_job(stdin_socket, job)

        started = time.monotonic()
        try:
            exit_status = container.wait(timeout=overall_deadline).get("StatusCode")
        except Exception as exc:  # noqa: BLE001 - SDK raises ReadTimeout/APIError
            # The runner did not finish inside its own ceiling. Per-case limits
            # are enforced inside the container, so reaching this means the
            # runner itself wedged, not the submission.
            logger.error("Sandbox %s exceeded %ss: %s", name, overall_deadline, exc)
            raise SandboxUnavailable(
                "The sandbox did not finish within its deadline."
            ) from exc
        elapsed = time.monotonic() - started

        stdout = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
        stderr = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")

        if not stdout.strip():
            logger.error(
                "Sandbox produced no result after %.1fs (exit=%s): %s",
                elapsed,
                exit_status,
                stderr[:500],
            )
            raise SandboxUnavailable(
                "The sandbox produced no result. The submission was not judged."
            )

        try:
            payload = json.loads(stdout)
        except json.JSONDecodeError as exc:
            logger.error("Sandbox returned unparseable output: %s", stdout[:500])
            raise SandboxUnavailable("The sandbox returned malformed output.") from exc

        return SandboxResult(
            compiled=bool(payload.get("compiled")),
            compile_output=payload.get("compile_output", "") or "",
            cases=[
                CaseOutcome(
                    id=str(case.get("id")),
                    status=case.get("status", "internal_error"),
                    stdout=case.get("stdout", ""),
                    stderr=case.get("stderr", ""),
                    runtime_ms=int(case.get("runtime_ms", 0)),
                    memory_kb=int(case.get("memory_kb", 0)),
                )
                for case in payload.get("cases", [])
            ],
        )

    finally:
        # The container is destroyed whatever happened, including on an
        # exception path. A judge that leaks containers exhausts its host
        # within a contest.
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:  # noqa: BLE001, S110 - best effort teardown
                logger.warning("Could not remove sandbox container %s", name)
        try:
            client.close()
        except Exception:  # noqa: BLE001, S110
            pass


def probe() -> dict[str, Any]:
    """Report whether the sandbox is usable. Feeds the admin health endpoint."""
    try:
        client = _client()
        try:
            client.images.get(settings.JUDGE_SANDBOX_IMAGE)
        finally:
            client.close()
    except SandboxUnavailable as exc:
        return {"available": False, "detail": str(exc)}
    except Exception as exc:  # noqa: BLE001
        return {
            "available": False,
            "detail": f"Sandbox image {settings.JUDGE_SANDBOX_IMAGE} is not present: {exc}",
        }
    return {"available": True, "image": settings.JUDGE_SANDBOX_IMAGE}


__all__ = ["CaseOutcome", "SandboxResult", "SandboxUnavailable", "probe", "run_submission"]
