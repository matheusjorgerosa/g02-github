package models

type SpatialResponse struct {
    Latitude  float64 `json:"latitude" bigquery:"latitude"`
    Longitude float64 `json:"longitude" bigquery:"longitude"`
    Volume    int64   `json:"weighted_uniques" bigquery:"volume"` 
}