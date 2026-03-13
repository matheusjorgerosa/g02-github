FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init -g ./internal/main.go

RUN CGO_ENABLED=0 GOOS=linux go build -o api-server ./internal/main.go

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /root/

COPY --from=builder /app/api-server .

COPY --from=builder /app/docs ./docs

COPY --from=builder /app/internal/.env . 

EXPOSE 8080

CMD ["./api-server"]

