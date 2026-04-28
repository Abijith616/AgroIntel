#!/bin/bash
curl -s --max-time 30 "https://overpass-api.de/api/interpreter" \
  --data-urlencode 'data=[out:json][timeout:25];(node["amenity"="marketplace"](around:40000,9.93,76.27);node["shop"="greengrocer"](around:40000,9.93,76.27);node["shop"="supermarket"](around:40000,9.93,76.27););out 20;' \
  2>&1 | head -120
