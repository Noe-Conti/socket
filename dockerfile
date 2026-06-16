FROM python:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip --no-cache-dir -r requirements.txt
COPY . /app

EXPOSE 443

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "443", "--ssl-keyfile", "certs/key.pem", "--ssl-certfile", "certs/cert.pem"]
