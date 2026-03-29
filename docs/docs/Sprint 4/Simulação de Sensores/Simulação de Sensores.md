---
Title: Atualização da Simulação de Sensores – Envio de Dados para o Gateway
sidebar_position: 2
---

> O desenvolvimento inicial dessa simulação está documentado [na Sprint Anterior](../../Sprint%203/Simulação%20de%20Sensores/Simulação%20de%20Sensores.md).

Durante a quarta sprint, foi adicionado o **timestamp** para permitir associar os dados ao horário em que são gerados, e não somente ao horário em que são salvos no banco de dados.

Para isso, foram necessárias três alterações principais no código:

**1. Sincronização de horário via NTP**

A função `setup()` passou a incluir a sincronização de horário com o servidor `pool.ntp.org`, configurado para o fuso horário de Brasília (UTC-3). O dispositivo aguarda até que a sincronização seja concluída antes de iniciar o envio de dados.

```cpp
#include <time.h>

const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -3 * 3600; // UTC-3 (Brasília)
const int   daylightOffset_sec = 0;
```

```cpp
// Trecho adicionado ao final do setup()
configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
Serial.print("Sincronizando NTP");
struct tm timeinfo;
while (!getLocalTime(&timeinfo)) {
  delay(500);
  Serial.print(".");
}
Serial.println("\nHora sincronizada: " + getTimestamp());
```

**2. Função `getTimestamp()`**

Foi criada uma função auxiliar que retorna o horário atual no formato ISO 8601 (`YYYY-MM-DDTHH:MM:SS`). Caso a hora local não esteja disponível, retorna o valor padrão `1970-01-01T00:00:00`.

```cpp
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00";
  }
  char buf[20];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buf);
}
```

**3. Campo `timestamp` incluído no payload**

O campo foi adicionado ao documento JSON montado a cada requisição:

```cpp
String timestamp = getTimestamp();
// ...
doc["timestamp"] = timestamp;
```

## Payload JSON

O payload passou a incluir o campo `timestamp`:

```json
{
  "latitude": -23.55052,
  "longitude": -46.633308,
  "idade": 34,
  "classe_social": "B2",
  "genero": "F",
  "timestamp": "2025-05-10T14:32:07"
}
```

## Envio da requisição HTTP

Segue:

* Método: **POST**
* Header: `Content-Type: application/json`
* Destino: Gateway definido em `API_ENDPOINT`

## Log de execução

Para cada requisição, o monitor serial exibe:

* Número sequencial da requisição
* Código de status HTTP
* Payload enviado (incluindo o timestamp)
* Resposta retornada pelo servidor

**Exemplo de log de sucesso:**

```
[12] HTTP 202 | Payload: {"latitude":-23.55,"longitude":-46.63,"idade":29,"classe_social":"A","genero":"M","timestamp":"2025-05-10T14:32:07"} | Response: {"message_id":"18847281332123229","status":"accepted"}
```

**Exemplo de erro:**

```
[13] Erro: connection refused
```

## Remoção do `delay`
Ademias, o `delay(200)` que existia ao final do `loop()` na versão anterior foi removido. O intervalo entre requisições agora depende apenas do tempo de resposta do servidor e do processamento interno, tornando o envio contínuo assim que cada requisição é concluída.