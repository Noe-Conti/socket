FROM python:latest

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip --no-cache-dir requirements.txt
COPY . /app

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]
