# Servicio local de verificación de imágenes

Servicio privado de inferencia para el modelo CNN de frecuencias. En Docker escucha dentro del contenedor y publica el puerto solo en `127.0.0.1:8090`; no publica el archivo del modelo ni guarda las imágenes recibidas.

## Iniciar

Desde la raíz del repositorio:

```sh
docker compose up -d image-verifier
```

El endpoint `GET http://127.0.0.1:8090/health` permite comprobar que el modelo se cargó. En otra terminal, inicia Next.js con `IMAGE_VERIFICATION_URL=http://127.0.0.1:8090/verify`.

## Contrato HTTP

- `POST /verify`: recibe el archivo binario como cuerpo, su tipo MIME en `Content-Type` y el hash SHA-256 en `X-Image-SHA256`.
- Responde con el hash, `PROBABLE_REAL` o `PROBABLE_AI`, el puntaje, la latencia y la huella SHA-256 del modelo.
- Rechaza formatos distintos de JPEG, PNG y WebP, cuerpos mayores a 10 MB, hashes inconsistentes y dimensiones desproporcionadas.

El umbral proviene de `metricas.json` (`0.6144025325775146`); no se recalcula ni se redondea para decidir. El puntaje no se presenta como probabilidad calibrada. El resultado clasifica la imagen y no verifica la veracidad de una noticia.

## Archivos

- `modelo.keras`: pesos y arquitectura copiados del modelo facilitado por el usuario.
- `metricas.json`: umbral y métricas del conjunto de evaluación que acompaña al modelo.
- `detector_frecuencias.py`: preprocesamiento usado por el proyecto original.
