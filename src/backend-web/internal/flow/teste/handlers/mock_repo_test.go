package handlers

import (
	"context"
	"backend-web/internal/flow/models"
)


type MockFlowRepository struct {
	MockGetSpatialData         func(ctx context.Context, filters models.FilterPayload) ([]models.SpatialResponse, error)
	MockGetGeneralMetrics      func(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error)
	MockGetNeighborhoodRanking func(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error)
	MockGetDemographics        func(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error)
}

func (m *MockFlowRepository) GetSpatialData(ctx context.Context, filters models.FilterPayload) 	([]models.SpatialResponse, error) {
	return m.MockGetSpatialData(ctx, filters)
}

func (m *MockFlowRepository) GetGeneralMetrics(ctx context.Context, filters models.FilterPayload) (models.MetricsResponse, error) {
	return m.MockGetGeneralMetrics(ctx, filters)
}

func (m *MockFlowRepository) GetNeighborhoodRanking(ctx context.Context, filters models.FilterPayload, limit int) ([]models.RankingResponse, error) {
	return m.MockGetNeighborhoodRanking(ctx, filters, limit)
}

func (m *MockFlowRepository) GetDemographics(ctx context.Context, filters models.FilterPayload) (models.DemographicsResponse, error) {
	return m.MockGetDemographics(ctx, filters)
}