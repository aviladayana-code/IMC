#!/usr/bin/env bash
# Script para subir Kinemetrix a GitHub
# Repositorio destino: https://github.com/aviladayana-code/IMC
#
# Uso:
#   1. Asegúrate de tener git instalado y configurado (git config --global user.name/user.email)
#   2. Ejecuta este script desde la raíz del proyecto: bash push-to-github.sh
#   3. Cuando se te pida, ingresa tu Personal Access Token de GitHub como contraseña
#      (los tokens se generan en: https://github.com/settings/tokens)
#      Requiere permisos: repo (Full control of private repositories)

set -e

REPO_URL="https://github.com/aviladayana-code/IMC.git"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

echo "========================================"
echo "  Kinemetrix -> GitHub Push Script"
echo "========================================"
echo ""
echo "Repositorio destino: $REPO_URL"
echo ""

# Verificar que git está inicializado
if [ ! -d ".git" ]; then
  echo "Inicializando repositorio git..."
  git init
  git branch -M main
fi

# Agregar remote si no existe
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Agregando remoto 'origin'..."
  git remote add origin "$REPO_URL"
fi

# Verificar estado
echo "Estado actual del repositorio:"
git status --short
echo ""

# Hacer push
echo "Haciendo push a GitHub..."
echo "Si se te pide usuario: tu username de GitHub"
echo "Si se te pide contraseña: tu Personal Access Token (NO tu contraseña de GitHub)"
echo ""
git push -u origin main

echo ""
echo "========================================"
echo "  Push completado!"
echo "========================================"
echo ""
echo "Tu aplicación está disponible en:"
echo "  https://github.com/aviladayana-code/IMC"
echo ""
echo "Para clonar en otra máquina:"
echo "  git clone https://github.com/aviladayana-code/IMC.git"
echo "  cd IMC"
echo "  cp .env.example .env  # edita DATABASE_URL"
echo "  bun install"
echo "  bun run db:push"
echo "  bun run scripts/seed.ts  # opcional: crea cuenta demo"
echo "  bun run dev"
