package repository

import (
	"context"
	"fmt"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
)

func (r *FlowRepository) GetDemographics(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error) {
	getDist := func(col string) ([]models.CategoryValue, error) {
		sql := fmt.Sprintf("SELECT %s as category, COUNT(*) as volume, "+
			"ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER(), 2) as percentage "+
			"FROM `venus-m09.trusted.ingestao` "+
			"WHERE CAST(idade AS STRING) IN UNNEST(@ages) "+
			"AND genero IN UNNEST(@genders) "+
			"AND classe_social IN UNNEST(@classes) "+
			"GROUP BY category", col)

		it, err := r.db.Query(ctx, sql, filters)
		if err != nil { return nil, err }

		var dist []models.CategoryValue
		for {
			var row models.CategoryValue

			if err := it.Next(&row); err == iterator.Done { break } else if err != nil { return nil, err }
			dist = append(dist, row)
		}
		return dist, nil
	}

	genders, err := getDist("genero")
	if err != nil { return models.DemographicsResponse{}, err }
	
	classes, err := getDist("classe_social")
	if err != nil { return models.DemographicsResponse{}, err }
	
	return models.DemographicsResponse{Gender: genders, SocialClass: classes}, nil
}