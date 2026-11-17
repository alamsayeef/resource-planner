#!/bin/bash
set -e
ROOT="/workspaces/resource-planner"
mkdir -p "$ROOT/server/src/modules/"{employees,roles,project-types,projects,assignments,leave,holidays,capacity,config}
mkdir -p "$ROOT/client/src"
echo "Directories ready"
