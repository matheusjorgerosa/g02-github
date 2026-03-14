package handlers

import (
	"context"
	"backend-web/internal/flow/models"
)


type FlowRepository interface {
	GetSpatialData(ctx context.Context, filters models.FilterPayload) ([]models.SpatialResponse, error)
	GetGeneralMetrics(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error)
	GetNeighborhoodRanking(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error)
	GetDemographics(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error)
}


type FlowHandler struct {
	repo FlowRepository 
}

func NewFlowHandler(repo FlowRepository) *FlowHandler {
	return &FlowHandler{repo: repo}
}