package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"cloud.google.com/go/bigquery"
	"backend-web/internal/flow/models"
)

type BigQueryAdapter struct {
	client *bigquery.Client
}

func NewBigQueryAdapter(client *bigquery.Client) *BigQueryAdapter {
	return &BigQueryAdapter{client: client}
}

// expandAgeRanges converte faixas etárias ("18-19", "20-29", "80+") em idades individuais ("18","19","20",...).
func expandAgeRanges(ranges []string) []string {
	var ages []string
	for _, r := range ranges {
		if strings.HasSuffix(r, "+") {
			base, err := strconv.Atoi(strings.TrimSuffix(r, "+"))
			if err != nil {
				continue
			}
			for i := base; i <= 99; i++ {
				ages = append(ages, fmt.Sprintf("%d", i))
			}
		} else if parts := strings.SplitN(r, "-", 2); len(parts) == 2 {
			lo, err1 := strconv.Atoi(parts[0])
			hi, err2 := strconv.Atoi(parts[1])
			if err1 != nil || err2 != nil {
				continue
			}
			for i := lo; i <= hi; i++ {
				ages = append(ages, fmt.Sprintf("%d", i))
			}
		} else {
			ages = append(ages, r)
		}
	}
	return ages
}

func (b *BigQueryAdapter) Query(ctx context.Context, sql string, f models.FilterPayload) (RowIterator, error) {
	if b == nil || b.client == nil {
		return nil, errors.New("BigQuery nao configurado no ambiente atual")
	}

	q := b.client.Query(sql)
	q.Parameters = []bigquery.QueryParameter{
		{Name: "ages", Value: expandAgeRanges(f.AgeGroups)},
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