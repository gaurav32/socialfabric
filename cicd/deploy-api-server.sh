#!/usr/bin/env bash
#set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
artifact_path="$script_dir/server-build/socialfabric-api-server-artifact.zip"
remote_user="u0_a317"
remote_host="192.168.0.167"
remote_dir="/data/data/com.termux/files/home/socialfabric/lib"

if [ ! -f "$artifact_path" ]; then
  echo "Artifact not found: $artifact_path"
  echo "Run ./cicd/build-api-server.sh first."
  exit 1
fi

mkdir -p "$script_dir/server-build"

ssh "$remote_user@$remote_host -p 8022" "mkdir -p '$remote_dir'" 
scp -P 8022 "$artifact_path" "$remote_user@$remote_host:$remote_dir/"
echo "Uploaded artifact to $remote_user@$remote_host:$remote_dir/"

