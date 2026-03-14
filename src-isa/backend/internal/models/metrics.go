package models

type MetricsResponse struct {
	TotalAudience int64       `json:"totalAudience"`
	Flow24h       []HourCount `json:"flow24h"`
}

type HourCount struct {
	Hour   int   `json:"hour"   bigquery:"hour"`
	Volume int64 `json:"volume" bigquery:"volume"`
}