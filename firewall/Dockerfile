FROM debian:latest

RUN apt update -y && apt upgrade -y

RUN apt install iptables -y

COPY firewall.sh /firewall.sh

RUN chmod +x /firewall.sh

CMD ["/firewall.sh"]
