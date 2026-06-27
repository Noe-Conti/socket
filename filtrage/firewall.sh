#!/bin/sh

LAN_POSTES="192.168.10.0/24"
LAN_SERVEURS="192.168.20.0/24"
LAN_ADMIN="192.168.40.0/24"

# Vider les règles précédentes
iptables -F DOCKER-USER

# Règle 1 : autoriser les réponses des connexions déjà établies
iptables -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Règle 2 : bloquer les postes → lan_admin (MongoDB, Mongo Express)
iptables -A DOCKER-USER -s $LAN_POSTES -d $LAN_ADMIN -j DROP

# Règle 3 : bloquer les serveurs → lan_admin (MongoDB, Mongo Express)
iptables -A DOCKER-USER -s $LAN_SERVEURS -d $LAN_ADMIN -j DROP

# Laisser Docker gérer le reste
iptables -A DOCKER-USER -j RETURN

echo "=== Règles pare-feu appliquées ==="
iptables -L DOCKER-USER -v --line-numbers

tail -f /dev/null
