FROM debian:latest

RUN apt update -y && apt upgrade -y

RUN apt install iptables -y

COPY firewall.sh /filtrage.sh

RUN chmod +x /filtrage.sh

CMD ["/firewall.sh"]
