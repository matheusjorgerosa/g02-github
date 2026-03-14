package models

type RankingResponse struct {
	Name   string `json:"name"   bigquery:"name"`
	Volume int64  `json:"volume" bigquery:"volume"`
}

