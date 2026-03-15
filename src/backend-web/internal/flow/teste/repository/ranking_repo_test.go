package repository

import (
	"context"
	"errors"
	"testing"
	"google.golang.org/api/iterator"
	"backend-web/internal/flow/models"
	"backend-web/internal/flow/repository"
)

type MockDBEngine struct {
	MockQuery func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error)
}

func (m *MockDBEngine) Query(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
	return m.MockQuery(ctx, sql, filters)
}

type MockIterator struct {
	Rows  []struct {
		Lat    float64
		Lng    float64
		Volume int
	}
	index int
}

func (m *MockIterator) Next(dst interface{}) error {
	if m.index >= len(m.Rows) {
		return iterator.Done
	}


	row := dst.(*struct {
		Lat    float64 `bigquery:"latitude"`
		Lng    float64 `bigquery:"longitude"`
		Volume int     `bigquery:"volume"`
	})

	row.Lat = m.Rows[m.index].Lat
	row.Lng = m.Rows[m.index].Lng
	row.Volume = m.Rows[m.index].Volume

	m.index++
	return nil
}

type MockGeoCoder struct {
	MockReverseGeocode func(ctx context.Context, lat, lng float64) (string, error)
}

func (m *MockGeoCoder) ReverseGeocode(ctx context.Context, lat, lng float64) (string, error) {
	return m.MockReverseGeocode(ctx, lat, lng)
}

func TestGetNeighborhoodRanking(t *testing.T) {
	tests := []struct {
		name           string
		mockDBSetup    func() repository.DBEngine
		mockGeoSetup   func() repository.GeoCoder
		expectedLen    int
		expectedStreet string
		expectError    bool
	}{
		{
			name: "Sucesso - Deve retornar ranking formatado com nome de rua",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return &MockIterator{
							Rows: []struct{ Lat float64; Lng float64; Volume int }{
								{Lat: -23.55, Lng: -46.63, Volume: 150},
							},
						}, nil
					},
				}
			},
			mockGeoSetup: func() repository.GeoCoder {
				return &MockGeoCoder{
					MockReverseGeocode: func(ctx context.Context, lat, lng float64) (string, error) {
						return "Avenida Paulista", nil
					},
				}
			},
			expectedLen:    1,
			expectedStreet: "Avenida Paulista",
			expectError:    false,
		},
		{
			name: "Sucesso - Endereço não encontrado (Fallback)",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return &MockIterator{
							Rows: []struct{ Lat float64; Lng float64; Volume int }{
								{Lat: 0.0, Lng: 0.0, Volume: 10},
							},
						}, nil
					},
				}
			},
			mockGeoSetup: func() repository.GeoCoder {
				return &MockGeoCoder{
					MockReverseGeocode: func(ctx context.Context, lat, lng float64) (string, error) {
						return "", errors.New("não encontrado")
					},
				}
			},
			expectedLen:    1,
			expectedStreet: "Rua não encontrada",
			expectError:    false,
		},
		{
			name: "Erro - Falha na query do BigQuery",
			mockDBSetup: func() repository.DBEngine {
				return &MockDBEngine{
					MockQuery: func(ctx context.Context, sql string, filters models.FilterPayload) (repository.RowIterator, error) {
						return nil, errors.New("timeout no BQ")
					},
				}
			},
			mockGeoSetup: func() repository.GeoCoder { return &MockGeoCoder{} },
			expectedLen:  0,
			expectError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repository.NewFlowRepository(tt.mockDBSetup(), tt.mockGeoSetup())

			res, err := repo.GetNeighborhoodRanking(context.Background(), models.FilterPayload{}, 10)

			if tt.expectError && err == nil {
				t.Errorf("Esperava um erro, mas não ocorreu")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Não esperava erro, ocorreu: %v", err)
			}
			if len(res) != tt.expectedLen {
				t.Errorf("Esperava len %d, obteve %d", tt.expectedLen, len(res))
			}
			if len(res) > 0 && res[0].Name != tt.expectedStreet {
				t.Errorf("Esperava rua '%s', obteve '%s'", tt.expectedStreet, res[0].Name)
			}
		})
	}
}