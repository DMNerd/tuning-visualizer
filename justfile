# Justfile for building and running with Docker or Podman

# Default shell for running commands
set shell := ["bash", "-cu"]

# ---------------------------
# Docker tasks
# ---------------------------

docker-build:
    docker build -t tuning-visualizer .

docker-up: docker-build
    docker compose down
    docker compose up -d

# ---------------------------
# Podman tasks
# ---------------------------

podman-build:
    podman build -t tuning-visualizer .

podman-up: podman-build
    podman compose down
    podman compose up -d
