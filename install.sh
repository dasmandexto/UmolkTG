#!/usr/bin/env bash
# ==============================================================================
# UmolkTG — 1-Click Installer for Linux VPS / Host (Ubuntu/Debian/CentOS)
# ==============================================================================
set -e

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

clear

echo -e "${PURPLE}======================================================================${NC}"
echo -e "${CYAN}             ⚡ UmolkTG — Установка в 1 клик на свой сервер           ${NC}"
echo -e "${WHITE}    Telegram Automation Suite · Headless VoIP Dialer · Vast.ai RVC    ${NC}"
echo -e "${PURPLE}======================================================================${NC}"
echo ""

# Check root / sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}[!] Скрипт запущен без прав root. Пробуем повысить привилегии через sudo...${NC}"
  exec sudo bash "$0" "$@"
fi

# Detect Linux Distribution
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO=$ID
  VERSION=$VERSION_ID
else
  DISTRO="unknown"
fi

echo -e "${BLUE}[*] Обнаружена операционная система:${NC} ${WHITE}${DISTRO} ${VERSION}${NC}"

# Detect Public IP
SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org || curl -s --max-time 5 https://ifconfig.me || echo "127.0.0.1")
echo -e "${BLUE}[*] Внешний IP сервера:${NC} ${WHITE}${SERVER_IP}${NC}"
echo ""

# Update and install base tools
echo -e "${YELLOW}[1/5] Обновление пакетов и установка системных зависимостей...${NC}"
if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
  apt-get update -qq
  apt-get install -y -qq curl wget git unzip ca-certificates gnupg lsb-release ufw build-essential
elif [ "$DISTRO" = "centos" ] || [ "$DISTRO" = "rhel" ] || [ "$DISTRO" = "rocky" ] || [ "$DISTRO" = "almalinux" ]; then
  yum update -y -q
  yum install -y -q curl wget git unzip ca-certificates ufw gcc-c++ make
fi

# Install Docker & Docker Compose if not installed
echo -e "${YELLOW}[2/5] Проверка и установка Docker & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${CYAN}    Установка Docker Engine через официальный скрипт...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh > /dev/null 2>&1
  rm -f get-docker.sh
  systemctl enable --now docker > /dev/null 2>&1
  echo -e "${GREEN}    ✓ Docker успешно установлен.${NC}"
else
  echo -e "${GREEN}    ✓ Docker уже установлен: $(docker --version)${NC}"
fi

# Ensure docker compose plugin exists
if ! docker compose version &> /dev/null; then
  echo -e "${CYAN}    Установка плагина docker-compose-plugin...${NC}"
  if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
    apt-get install -y -qq docker-compose-plugin
  fi
fi

# Setup installation directory
INSTALL_DIR="/opt/umolktg"
echo -e "${YELLOW}[3/5] Подготовка директории проекта (${INSTALL_DIR})...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# If current directory contains package.json, copy it; else download or pull
if [ -f "$PWD/package.json" ]; then
  echo -e "${CYAN}    Копирование локальных файлов приложения...${NC}"
elif [ -d "/app" ] && [ -f "/app/package.json" ]; then
  cp -r /app/* "$INSTALL_DIR/"
fi

# Configure Firewall
echo -e "${YELLOW}[4/5] Настройка портов файрвола (3000 Web UI, 8765 VoIP Daemon)...${NC}"
if command -v ufw &> /dev/null; then
  ufw allow 3000/tcp comment "UmolkTG Web UI" > /dev/null 2>&1 || true
  ufw allow 8765/tcp comment "UmolkTG VoIP Daemon" > /dev/null 2>&1 || true
fi

# Build and start Docker containers
echo -e "${YELLOW}[5/5] Сборка и запуск контейнеров через Docker Compose...${NC}"
if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
  docker compose down --remove-orphans > /dev/null 2>&1 || true
  docker compose up -d --build
else
  # Direct Node.js native fallback if compose file not found
  echo -e "${CYAN}    Сборка через локальный Node.js...${NC}"
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs
  fi
  npm install --production=false
  npm run build
  npm install -g pm2 > /dev/null 2>&1 || true
  pm2 delete umolktg > /dev/null 2>&1 || true
  pm2 start server.ts --name umolktg --interpreter npx --interpreter-args tsx
  pm2 save > /dev/null 2>&1 || true
  pm2 startup > /dev/null 2>&1 || true
fi

# Check if port 3000 is open
sleep 3
echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}  🎉 ГОТОВО! UmolkTG УСПЕШНО УСТАНОВЛЕН И ЗАПУЩЕН!                    ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "${WHITE}  🔗 Веб-интерфейс комбайна:${NC}  ${CYAN}http://${SERVER_IP}:3000${NC}"
echo -e "${WHITE}  📞 Headless VoIP C++ Демон:${NC} ${CYAN}ws://${SERVER_IP}:8765/ws${NC}"
echo -e "${WHITE}  🎙️ Vast.ai RVC Интеграция:${NC} ${PURPLE}Готова к подключению в интерфейсе${NC}"
echo ""
echo -e "${YELLOW}Команды управления сервером:${NC}"
echo -e "  • Просмотр логов:          ${WHITE}cd /opt/umolktg && docker compose logs -f${NC}"
echo -e "  • Перезапуск:              ${WHITE}cd /opt/umolktg && docker compose restart${NC}"
echo -e "  • Остановка:               ${WHITE}cd /opt/umolktg && docker compose down${NC}"
echo -e "  • Обновление проекта:      ${WHITE}cd /opt/umolktg && docker compose pull && docker compose up -d${NC}"
echo ""
echo -e "${PURPLE}======================================================================${NC}"
