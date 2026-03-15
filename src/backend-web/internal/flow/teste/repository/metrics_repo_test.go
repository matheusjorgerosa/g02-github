package repository

import (
	"context"
	"testing"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
	"backend-web/internal/flow/repository"
)

type MetricsIterator struct {
	Rows  []models.HourCount
	index int
}
func (m *MetricsIterator) Next(dst interface{}) error {
	if m.index >= len(m.Rows) { return iterator.Done }
	row := dst.(*models.HourCount)
	*row = m.Rows[m.index]
	m.index++
	return nil
}

func TestGetGeneralMetrics(t *testing.T) {
	tests := []struct {
		name          string
		mockDBSetup   func() repository.DBEngine
		expectedTotal int64
		expectedFlows int
	}{
		{
			name: "Sucesso - Soma total e mapeia as horas corretamente",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return &MetricsIterator{
							Rows: []models.HourCount{
								{Hour: 10, Volume: 150},
								{Hour: 11, Volume: 50},
							},
						}, nil
					},
				}
			},
			expectedTotal: 200,
			expectedFlows: 2,
		},
		{
			name: "Sucesso - Retorno vazio do banco",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return &MetricsIterator{Rows: []models.HourCount{}}, nil
					},
				}
			},
			expectedTotal: 0,
			expectedFlows: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repository.NewFlowRepository(tt.mockDBSetup(), &MockGeoCoder{})
			res, err := repo.GetGeneralMetrics(context.Background(), models.FilterPayload{})

			if err != nil { t.Errorf("Erro inesperado: %v", err) }
			if res.TotalAudience != tt.expectedTotal {
				t.Errorf("TotalAudience esperado %d, obtido %d", tt.expectedTotal, res.TotalAudience)
			}
			if len(res.Flow24h) != tt.expectedFlows {
				t.Errorf("Total de fluxos horários esperado %d, obtido %d", tt.expectedFlows, len(res.Flow24h))
			}
		})
	}
}