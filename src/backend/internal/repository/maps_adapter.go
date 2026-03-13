package repository

import (
	"context"
	"os"
	"googlemaps.github.io/maps"
)

type GoogleMapsAdapter struct {
	client *maps.Client
}

func NewGoogleMapsAdapter() (*GoogleMapsAdapter, error) {
	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	client, err := maps.NewClient(maps.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}
	return &GoogleMapsAdapter{client: client}, nil
}

func (g *GoogleMapsAdapter) ReverseGeocode(ctx context.Context, lat, lng float64) (string, error) {
	req := &maps.GeocodingRequest{
		LatLng: &maps.LatLng{Lat: lat, Lng: lng},
	}

	resp, err := g.client.ReverseGeocode(ctx, req)
	if err != nil || len(resp) == 0 {
		return "Rua não encontrada", nil
	} 

	for _, result := range resp[0].AddressComponents {
		for _, t := range result.Types {
			if t == "route" {
				return result.LongName, nil
			}
		}
	}
	return resp[0].FormattedAddress, nil
}
