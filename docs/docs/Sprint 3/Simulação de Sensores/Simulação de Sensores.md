---
Title: Simulação de Sensores – Envio de Dados para o Gateway
sidebar_position: 2
---

## Estrutura do Projeto

```
simulacao-sensores/
 └── firmware/
      ├── config.h
      └── firmware.ino
```

Este firmware foi desenvolvido para simular o envio de dados de celulares para o gateway, permitindo testar ingestão, processamento e armazenamento de dados no backend.

### `config.h`

Define as configurações sensíveis:

```cpp
#define API_ENDPOINT "url"
#define WIFI_SSID "SSID"
#define WIFI_PASSWORD "senha"
```

### Parâmetros

| Variável        | Descrição                            |
| --------------- | ------------------------------------ |
| `API_ENDPOINT`  | URL do gateway que receberá os dados |
| `WIFI_SSID`     | Nome da rede Wi-Fi                   |
| `WIFI_PASSWORD` | Senha da rede                        |

## Funcionamento do `firmware.ino`

### Inicialização (`setup()`)

* Inicializa comunicação serial (115200 baud)
* Conecta ao Wi-Fi
* Exibe o IP local quando conectado

Saída esperada no Serial Monitor:

```
Conectando ao WiFi...
Conectado! IP: 192.168.x.x
```

### Loop Principal (`loop()`)

Executa continuamente:

#### Verificação de conexão

Confere se o Wi-Fi ainda está conectado.
Caso contrário, tenta reconectar automaticamente.

#### Geração de dados simulados

Os dados enviados representam perfis demográficos associados a localizações.

**Localização geográfica**

* Selecionada aleatoriamente a partir de uma lista de coordenadas
* Representa pontos urbanos

**Dados demográficos simulados**

| Campo           | Descrição                               |
| --------------- | --------------------------------------- |
| `idade`         | Idade aleatória entre 18 e 79 anos      |
| `classe_social` | Classe sorteada entre A, B1, B2, C e DE |
| `genero`        | Masculino (M) ou Feminino (F)           |

#### Montagem do payload JSON

O firmware constrói dinamicamente um objeto JSON:

```json
{
  "latitude": -23.55052,
  "longitude": -46.633308,
  "idade": 34,
  "classe_social": "B2",
  "genero": "F"
}
```

#### Envio da requisição HTTP

* Método: **POST**
* Header: `Content-Type: application/json`
* Destino: Gateway definido em `API_ENDPOINT`

#### Log de execução

Para cada requisição, o monitor serial exibe:

* Número sequencial da requisição
* Código de status HTTP
* Payload enviado
* Resposta retornada pelo servidor

**Exemplo de log de sucesso:**

```
[12] HTTP 202 | Payload: {"latitude":-23.55,"longitude":-46.63,"idade":29,"classe_social":"A","genero":"M"} | Response: {"message_id":"18847281332123229","status":"accepted"}
```

**Exemplo de erro:**

```
[13] Erro: connection refused
```

### Frequência de envio

As requisições são enviadas a cada:

```
200 ms
```

Isso resulta em aproximadamente 5 eventos por segundo por dispositivo, permitindo testes de carga no gateway.
