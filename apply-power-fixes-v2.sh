#!/bin/bash
set -e
echo "=== Finalne optymalizacje baterii ==="
echo ""

echo "1/3 Aktualizacja TLP config (amdgpu runtime PM + USB tuning)"
sudo cp /tmp/01-battery-v2.conf /etc/tlp.d/01-battery.conf
sudo systemctl restart tlp
echo "OK"

echo ""
echo "2/3 Kernel cmdline - NVMe APST + PCIe ASPM force"
CMDLINE_FILE=/boot/refind_linux.conf
if grep -q "nvme_core.default_ps_max_latency_us" "$CMDLINE_FILE"; then
    echo "Cmdline juz zawiera NVMe APST, pomijam"
else
    sudo sed -i 's/"quiet zswap.enabled=0 nowatchdog splash/"quiet zswap.enabled=0 nowatchdog splash nvme_core.default_ps_max_latency_us=1500 pcie_aspm=force/' "$CMDLINE_FILE"
    echo "OK (zadziala po restarcie)"
fi

echo ""
echo "3/3 Powertop auto-tune systemd service"
sudo tee /etc/systemd/system/powertop.service > /dev/null << 'EOF'
[Unit]
Description=Powertop auto-tune
After=multi-user.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/powertop --auto-tune

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable powertop.service
sudo systemctl start powertop.service
echo "OK"

echo ""
echo "=== Zmiany wykonane ==="
echo "Restart wymagany dla: kernel cmdline (nvme, pcie_aspm)"
echo "Sprawdz natychmiast: systemctl status powertop"
