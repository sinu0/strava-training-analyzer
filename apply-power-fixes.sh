#!/bin/bash
set -e

echo "=== 1/3 Maskowanie power-profiles-daemon ==="
sudo systemctl mask power-profiles-daemon.service

echo "=== 2/3 Wgrywanie TLP configu baterii ==="
sudo cp /tmp/tlp-battery.conf /etc/tlp.d/01-battery.conf
sudo systemctl restart tlp

echo "=== 3/3 Ustawianie swappiness ==="
sudo cp /tmp/99-swappiness.conf /etc/sysctl.d/99-swappiness.conf
sudo sysctl -w vm.swappiness=30

echo ""
echo "=== Gotowe ==="
echo "Zweryfikuj:"
echo "  systemctl status power-profiles-daemon"
echo "  cat /etc/sysctl.d/99-swappiness.conf"
echo "  cat /proc/sys/vm/swappiness"
