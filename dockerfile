FROM python:latest

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip --no-cache-dir fastapi torch uvicorn pydantic

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]
