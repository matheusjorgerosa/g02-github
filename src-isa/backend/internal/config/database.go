package config

import (
    "context"
    "cloud.google.com/go/bigquery"
    "log"
)

func ConnectBigQuery(ctx context.Context, projectID string) *bigquery.Client {
    client, err := bigquery.NewClient(ctx, projectID)
    if err != nil {
        log.Fatalf("Erro ao conectar no BigQuery: %v", err)
    }
    return client
}