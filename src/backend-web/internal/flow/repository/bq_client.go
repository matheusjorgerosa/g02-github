package repository

import (
	"context"
	"backend-web/internal/flow/models"
)


type DBEngine interface {
	Query(ctx context.Context, sql string, filters models.FilterPayload) (RowIterator, error)
}

type RowIterator interface {
	Next(dst interface{}) error
}

type GeoCoder interface {
	ReverseGeocode(ctx context.Context, lat, lng float64) (string, error)
}

type FlowRepository struct {
	db  DBEngine
	geo GeoCoder
}

func NewFlowRepository(db DBEngine, geo GeoCoder) *FlowRepository {
	return &FlowRepository{db: db, geo: geo}
}