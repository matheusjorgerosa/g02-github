package repository

import (
	"context"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
)

func (r *FlowRepository) GetSpatialData(ctx context.Context, filters models.FilterPayload) ([]models.SpatialResponse, error) {
	sql := "SELECT latitude, longitude, COUNT(*) as volume " +
		"FROM `venus-m09.trusted.ingestao` " +
		"WHERE CAST(idade AS STRING) IN UNNEST(@ages) " +
		"AND genero IN UNNEST(@genders) " +
		"AND classe_social IN UNNEST(@classes) " +
		"GROUP BY latitude, longitude"

	it, err := r.db.Query(ctx, sql, filters)
	if err != nil {
		return nil, err
	}

	var results []models.SpatialResponse
	for {
		var row models.SpatialResponse
		if err := it.Next(&row); err == iterator.Done {
			break
		} else if err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, nil
}