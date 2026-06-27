#!/bin/sh

LAN_POSTES="192.168.10.0/24"
LAN_SERVEURS="192.168.20.0/24"
LAN_ADMIN="192.168.40.0/24"

# Vider les règles précédentes
iptables -F DOCKER-USER

# Règle 1 : autoriser les réponses des connexions déjà établies (dans tout l'espace docker compose)
iptables -A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
#"conntrack" permet d'appliquer des règles aux connexions déjà établies.


# Règle 2 : bloquer connexion lan_postes → lan_admin 
iptables -A DOCKER-USER -s $LAN_POSTES -d $LAN_ADMIN -j DROP

# Règle 3 : bloquer connexion lazn_serveurs → lan_admin
iptables -A DOCKER-USER -s $LAN_SERVEURS -d $LAN_ADMIN -j DROP

# Connexions qui ne correspondent pas aux règles précédentes sont transférées au reste des règles automatiques docker
iptables -A DOCKER-USER -j RETURN





