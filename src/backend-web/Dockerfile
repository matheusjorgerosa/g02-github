# Estágio de Compilação
FROM golang:1.25-alpine AS builder

# Instala dependências
RUN apk add --no-cache git

WORKDIR /app

#Copia dependências
COPY go.mod go.sum ./
RUN go mod download

# Copia o resto do código
COPY . .

# Compila o binário. 
# CGO_ENABLED=0 binário seja estático
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Imagem
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .
# Copia o .env 
COPY --from=builder /app/.env . 

# Porta que o Gin vai rodar
EXPOSE 8080

# Iniciar a aplicação
CMD ["./main"]