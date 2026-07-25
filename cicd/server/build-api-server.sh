#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
out_dir="$script_dir"
archive_path="$out_dir/deploy/lib/socialfabric-api-server-artifact.zip"
staging_dir="$out_dir/staging"

mkdir -p "$out_dir" "$staging_dir"
rm -f "$archive_path"

copy_if_exists() {
  local src="$1"
  local dest="$2"
  if [ -e "$src" ]; then
    cp -R "$src" "$dest"
  fi
}

# Copy the files needed to build and run the server on a remote host.
copy_if_exists "$repo_root/artifacts/api-server/Dockerfile" "$staging_dir/"
copy_if_exists "$repo_root/docker-compose.yml" "$staging_dir/"
copy_if_exists "$repo_root/artifacts/api-server/package.json" "$staging_dir/"
copy_if_exists "$repo_root/artifacts/api-server/build.mjs" "$staging_dir/"
copy_if_exists "$repo_root/artifacts/api-server/tsconfig.json" "$staging_dir/"
copy_if_exists "$repo_root/package.json" "$staging_dir/"
copy_if_exists "$repo_root/pnpm-workspace.yaml" "$staging_dir/"
copy_if_exists "$repo_root/pnpm-lock.yaml" "$staging_dir/"
copy_if_exists "$repo_root/tsconfig.base.json" "$staging_dir/"
copy_if_exists "$repo_root/tsconfig.json" "$staging_dir/"
copy_if_exists "$repo_root/artifacts/api-server/src" "$staging_dir/"
copy_if_exists "$repo_root/lib" "$staging_dir/"
copy_if_exists "$repo_root/scripts" "$staging_dir/"
copy_if_exists "$repo_root/db" "$staging_dir/"
copy_if_exists "$repo_root/artifacts/api-server" "$staging_dir/"

# Exclude local-only and generated content from the archive.
find "$staging_dir" -type d \( -name node_modules -o -name .git -o -name dist -o -name build \) -prune -exec rm -rf {} +

# Create a copy-ready zip archive.
( cd "$staging_dir" && zip -r "$archive_path" . )

rm -rf "$staging_dir"

echo "Created deployable artifact: $archive_path"
