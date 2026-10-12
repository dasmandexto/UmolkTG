#!/bin/bash
set -e

echo "=== Сборка TeleRaptor C++ Headless VoIP & RVC Daemon ==="
mkdir -p build
cd build
cmake ..
make -j$(nproc)
echo "=== Успешно собрано! Бинарник: build/teleraptor_voip_daemon ==="
