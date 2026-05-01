#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="/tmp/z-image-studio/.venv"
GENERATE_SCRIPT="${HERE}/generate.py"
OUTPUT_DIR="${HERE}/../frontend/public/illustrations"

echo "🔧 Strava Analizator — image generation setup"
echo "   GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'unknown')"
echo "   Output: ${OUTPUT_DIR}"
echo ""

# ── 1. Create venv if missing ──
if [ ! -d "${VENV_DIR}" ]; then
    echo "[1/3] Creating virtual environment at ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
else
    echo "[1/3] Virtual environment already exists."
fi

# ── 2. Install dependencies ──
echo "[2/3] Installing Python dependencies (zimage + sdnq + torch + diffusers)..."
"${VENV_DIR}/bin/pip" install --upgrade pip zimage sdnq -q

echo ""
echo "✅ Setup complete."
echo ""
echo "Usage:"
echo "  ${VENV_DIR}/bin/python ${GENERATE_SCRIPT} [prefix] [--force]"
echo ""
echo "Examples:"
echo "  # Regenerate a specific image:"
echo "  ${VENV_DIR}/bin/python ${GENERATE_SCRIPT} hero-priorities --force"
echo ""
echo "  # Regenerate all hero images:"
echo "  ${VENV_DIR}/bin/python ${GENERATE_SCRIPT} hero --force"
echo ""
echo "  # Regenerate everything:"
echo "  ${VENV_DIR}/bin/python ${GENERATE_SCRIPT} --force"
echo ""
