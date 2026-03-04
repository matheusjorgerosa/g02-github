#include <WiFi.h>         
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
const char* endpoint = API_ENDPOINT;

int requestCount = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    float valor = 20.0 + random(0, 100) / 10.0;

    StaticJsonDocument<128> doc;
    doc["sensor"] = "temp-01";
    doc["valor"] = valor;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    requestCount++;

    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("[%d] HTTP %d | Payload: %s | Response: %s\n",
                    requestCount, httpCode, payload.c_str(), response.c_str());
    } else {
      Serial.printf("[%d] Erro: %s\n", requestCount, http.errorToString(httpCode).c_str());
    }

    http.end();
  } else {
    Serial.println("WiFi desconectado, reconectando...");
    WiFi.reconnect();
  }

  delay(2000);
}