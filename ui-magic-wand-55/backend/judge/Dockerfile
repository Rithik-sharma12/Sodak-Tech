# The sandbox image. Untrusted code runs here and nowhere else.
#
# Deliberately not built FROM the application image (SODAK-TECH-STACK.md §5.4:
# language images are built from minimal bases). It shares no layer with the
# tier that holds credentials, so a compromise of one is not a compromise of
# the other.
#
# What is absent matters more than what is present:
#   * no application source, no settings module, no .env
#   * no database driver, no Redis client, no cloud SDK
#   * no shell access from outside -- the container is created, given one job,
#     and destroyed
#   * no network, set at container creation rather than inside the image
#
# §5.5 wants images pinned by digest and rebuilt on a schedule. The tag here is
# a placeholder for that; pin it before this is exposed to real users.
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# One layer, no recommends, lists removed. Every extra package is another
# advisory to track on an image that runs hostile code by design.
RUN apt-get update && apt-get install --no-install-recommends -y \
        python3 \
        g++ \
        gcc \
        libc6-dev \
        openjdk-17-jdk-headless \
        nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

COPY runner.py /opt/runner.py

# The runner is owned by root and world-readable but not writable. Submitted
# code runs as this unprivileged user and cannot modify the harness judging it.
RUN useradd --uid 65532 --create-home --shell /usr/sbin/nologin judge \
    && chmod 0444 /opt/runner.py \
    && mkdir -p /box \
    && chown judge:judge /box

USER judge
WORKDIR /box

# Overridden at creation with the real job. Present so a container started by
# accident does nothing at all rather than something surprising.
CMD ["sleep", "0"]
