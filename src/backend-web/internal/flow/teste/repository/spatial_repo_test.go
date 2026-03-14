package repository

import (
	"context"
	"testing"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
	"backend-web/internal/flow/repository"
)

type SpatialIterator struct {
	Rows  []models.SpatialResponse
	index int
}
func (m *SpatialIterator) Next(dst interface{}) error {
	if m.index >= len(m.Rows) { return iterator.Done }
	row := dst.(*models.SpatialResponse)
	*row = m.Rows[m.index]
	m.index++
	return nil
}

func TestGetSpatialData(t *testing.T) {
	tests := []struct {
		name        string
		mockDBSetup func() repository.DBEngine
		expectedLen int
	}{
		{
			name: "Sucesso - Mapeamento de Latitude/Longitude",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return &SpatialIterator{
							Rows: []models.SpatialResponse{
								{Latitude: -23.5505, Longitude: -46.6333, Volume: 500},
								{Latitude: -22.9068, Longitude: -43.1729, Volume: 300},
							},
						}, nil
					},
				}
			},
			expectedLen: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repository.NewFlowRepository(tt.mockDBSetup(), &MockGeoCoder{})
			res, err := repo.GetSpatialData(context.Background(), models.FilterPayload{})

			if err != nil { t.Errorf("Erro inesperado: %v", err) }
			if len(res) != tt.expectedLen {
				t.Errorf("Esperado array com tamanho %d, obtido %d", tt.expectedLen, len(res))
			}
			if len(res) > 0 && res[0].Volume != 500 {
				t.Errorf("O volume mapeado falhou")
			}
		})
	}
}