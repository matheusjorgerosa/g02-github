#include <WiFi.h>         
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
const char* endpoint = API_ENDPOINT;

int requestCount = 0;

const float locations[][2] = {
{-23.58334,  -46.686511},
  {-23.62332,  -46.69964},
  {-23.5367702,-46.6543715},
  {-23.5376064,-46.6639499},
  {-23.5359656,-46.6627848},
  {-23.553436, -46.672653},
  {-23.54648,  -46.681503},
  {-23.552703, -46.678954},
  {-23.549935, -46.677319},
  {-23.5723209,-46.6458695},
  {-23.56579,  -46.65145},
  {-23.5809882,-46.6637179},
  {-23.5757273,-46.6574723},
  {-23.5768521,-46.656592},
  {-23.577032, -46.672463},
  {-23.5929665,-46.6470365},
  {-23.55721,  -46.66263},
  {-23.5733455,-46.6550994},
  {-23.571479, -46.665473},
  {-23.578485, -46.6625515},
  {-23.577475, -46.663294},
  {-23.5751150,-46.6779397},
  {-23.5842771,-46.6835017},
  {-23.6157943,-46.6174434},
  {-23.514543, -46.638992},
  {-23.5178060,-46.6298068},
  {-23.5038534,-46.6340617},
};
const int locationCount = 10;

const char* classesSociais[] = {"A", "B1", "B2", "C", "DE"};
const int classesCount = 5;

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));
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

    int locIndex = random(0, locationCount);
    float latitude  = locations[locIndex][0];
    float longitude = locations[locIndex][1];

    int idade = random(18, 80);
    int classeIndex = random(0, classesCount);
    const char* classeSocial = classesSociais[classeIndex];
    const char* genero = (random(0, 2) == 0) ? "M" : "F";

    StaticJsonDocument<256> doc;
    doc["latitude"]      = latitude;
    doc["longitude"]     = longitude;
    doc["idade"]         = idade;
    doc["classe_social"] = classeSocial;
    doc["genero"]        = genero;

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

  delay(200);
}