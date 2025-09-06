# Justfile for building and running with Docker or Podman

# Default shell for running commands
set shell := ["bash", "-cu"]

# ---------------------------
# Docker tasks
# ---------------------------

docker-up: 
    docker compose down
    docker compose up -d

# ---------------------------
# Podman tasks
# ---------------------------

podman-up: 
    podman compose down
    podman compose up -d
