#!/bin/bash
SRC="$HOME/Downloads"
DEST="$HOME/Desktop/ROBSON BRITTO/AOGIM/ad-irlanda-app"

# Copia qualquer .tsx dos Downloads para a pasta correta
for f in "$SRC"/*.tsx; do
  nome=$(basename "$f")
  if [ -f "$DEST/pages/$nome" ]; then
    cp "$f" "$DEST/pages/$nome"
    echo "✅ Atualizado: pages/$nome"
  fi
done

cd "$DEST"
git add -A
git status
