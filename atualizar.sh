#!/bin/bash
DEST="$HOME/Desktop/ROBSON BRITTO/AOGIM/ad-irlanda-app"

cd "$DEST"

# Verifica se há mudanças (incluindo arquivos novos não rastreados)
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "Nenhuma mudança para enviar."
  exit 0
fi

# Mostra o que vai ser enviado
echo ""
echo "Mudanças detectadas:"
git status --short
echo ""

# Pede mensagem de commit
read -p "Descreva o que foi feito (ex: 'adiciona campo de telefone'): " MENSAGEM

if [ -z "$MENSAGEM" ]; then
  MENSAGEM="atualização"
fi

git add -A
git commit -m "$MENSAGEM"
git push

echo ""
echo "Deploy iniciado! O site será atualizado em 1-2 minutos."
echo "Acompanhe em: https://app.netlify.com"
