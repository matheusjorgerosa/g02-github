package repository

import (
	"context"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
)

func (r *FlowRepository) GetGeneralMetrics(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error) {
	sql := "SELECT EXTRACT(HOUR FROM ingested_at) as hour, COUNT(*) as volume " +
		"FROM `venus-m09.trusted.ingestao` " +
		"WHERE CAST(idade AS STRING) IN UNNEST(@ages) " +
		"AND genero IN UNNEST(@genders) " +
		"AND classe_social IN UNNEST(@classes) " +
		"GROUP BY hour ORDER BY hour ASC"

	it, err := r.db.Query(ctx, sql, filters)
	if err != nil { return models.MetricsResponse{}, err }

	var flow []models.HourCount
	var total int64
	for {
		var row models.HourCount
		if err := it.Next(&row); err == iterator.Done { break } else if err != nil { return models.MetricsResponse{}, err }
		flow = append(flow, row)
		total += int64(row.Volume) 
	}
	return models.MetricsResponse{TotalAudience: total, Flow24h: flow}, nil
}