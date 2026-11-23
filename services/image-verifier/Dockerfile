FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY server.py detector_frecuencias.py metricas.json modelo.keras ./

EXPOSE 8090

CMD ["python", "server.py"]
