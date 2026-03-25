package config

import (
    "context"
    "cloud.google.com/go/bigquery"
    "log"
)

func ConnectBigQuery(ctx context.Context, projectID string) *bigquery.Client {
    client, err := bigquery.NewClient(ctx, projectID)
    if err != nil {
        log.Printf("Aviso: BigQuery indisponivel no ambiente atual: %v", err)
        return nil
    }
    return client
}