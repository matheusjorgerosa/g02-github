package repository

import (
	"context"
	"cloud.google.com/go/bigquery"
	"backend/internal/models"
)

type BigQueryAdapter struct {
	client *bigquery.Client
}

func NewBigQueryAdapter(client *bigquery.Client) *BigQueryAdapter {
	return &BigQueryAdapter{client: client}
}

func (b *BigQueryAdapter) Query(ctx context.Context, sql string, f models.FilterPayload) (RowIterator, error) {
	q := b.client.Query(sql)
	q.Parameters = []bigquery.QueryParameter{
		{Name: "ages", Value: f.AgeGroups},
		{Name: "genders", Value: f.Genders},
		{Name: "classes", Value: f.SocialClasses},
	}
	
	it, err := q.Read(ctx)
	if err != nil {
		return nil, err
	}
	return &BigQueryIterator{it: it}, nil
}

type BigQueryIterator struct {
	it *bigquery.RowIterator
}

func (i *BigQueryIterator) Next(dst interface{}) error {
	return i.it.Next(dst)
}