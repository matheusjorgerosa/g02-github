package models

type DemographicsResponse struct {
	Gender      []CategoryValue `json:"gender"`
	SocialClass []CategoryValue `json:"socialClass"`
}


type CategoryValue struct {
	Category   string  `json:"category"   bigquery:"category"`
	Percentage float64 `json:"percentage" bigquery:"percentage"`
	Volume     int64   `json:"volume"     bigquery:"volume"`
}