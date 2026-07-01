#Permet de passer plus de paramètres au backend lors de son exécution
import ssl
import uvicorn

uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=443,
    ssl_keyfile="certs/server.key",
    ssl_certfile="certs/server.crt",
    ssl_ca_certs="certs/ca.crt",
    ssl_cert_reqs=ssl.CERT_OPTIONAL,  # CERT_OPTIONAL : agents envoient leur cert, navigateur peut se connecter sans
)
