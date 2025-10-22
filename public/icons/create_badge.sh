#!/bin/bash
# Créer une icône badge monochrome (camion blanc simple)
convert -size 96x96 xc:transparent \
  -fill white \
  -draw "rectangle 10,40 35,70" \
  -draw "rectangle 35,35 85,70" \
  -draw "circle 25,72 25,80" \
  -draw "circle 55,72 55,80" \
  -draw "circle 75,72 75,80" \
  notification-badge.png

echo "Badge créé : $(file notification-badge.png)"
ls -lh notification-badge.png
