package repository

import (
	"context"
	"fmt"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
)

func (r *FlowRepository) GetNeighborhoodRanking(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error) {
	sql := fmt.Sprintf("SELECT latitude, longitude, COUNT(*) as volume "+
		"FROM `venus-m09.trusted.ingestao` "+
		"WHERE CAST(idade AS STRING) IN UNNEST(@ages) "+
		"AND genero IN UNNEST(@genders) "+
		"AND classe_social IN UNNEST(@classes) "+
		"GROUP BY latitude, longitude ORDER BY volume DESC LIMIT %d", limit)

	it, err := r.db.Query(ctx, sql, filters)
	if err != nil { 
		return nil, err 
	}

	var ranking []models.RankingResponse
	for {
		var row struct {
			Lat    float64 `bigquery:"latitude"`
			Lng    float64 `bigquery:"longitude"`
			Volume int     `bigquery:"volume"`
		}

		if err := it.Next(&row); err == iterator.Done { 
			break 
		} else if err != nil { 
			return nil, err 
		}

		streetName, _ := r.geo.ReverseGeocode(ctx, row.Lat, row.Lng)
		if streetName == "" {
			streetName = "Rua não encontrada"
		}

		ranking = append(ranking, models.RankingResponse{
			Name: streetName,
			Volume: int64(row.Volume),
		})
	}

	return ranking, nil
}