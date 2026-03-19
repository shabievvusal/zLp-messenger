FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod ./
# Скачиваем зависимости отдельным слоем (кэшируется)
RUN go mod download || true

COPY . .
# tidy + build
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server/main.go

# ── Runtime ────────────────────────────────────────────────────
# Use scratch — no external image needed; binary is fully static (CGO_ENABLED=0)
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /server /server
COPY --from=builder /app/migrations/ /app/migrations/

WORKDIR /app
EXPOSE 8080
CMD ["/server"]
