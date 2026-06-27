FROM python:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip --no-cache-dir -r requirements.txt
COPY . /app

EXPOSE 443

CMD ["python", "run_server.py"]
