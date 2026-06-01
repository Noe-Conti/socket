FROM python:3.12-slim

WORKDIR /app

RUN pip install psutil requests

COPY agent.py .

CMD ["python", "agent.py"]




