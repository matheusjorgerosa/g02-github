.PHONY: test-e2e test-e2e-spatial test-e2e-metrics test-e2e-ranking \
        test-e2e-demographics test-unit-adapter test-smoke lint


ROOT := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))/../


test-e2e:
	@echo "Inicio dos testes E2E"
	cd $(ROOT) && go test ./tests/integration/e2e/... \
		-v \
		-timeout=180s \
		-count=1 \
		-tags=integration \
		2>&1 | tee /tmp/e2e-results.txt
	@echo "Resultados em /tmp/e2e-results.txt"

test-e2e-spatial:
	cd $(ROOT) && go test ./tests/integration/e2e/spatial/... -v -timeout=120s -count=1

test-e2e-metrics:
	cd $(ROOT) && go test ./tests/integration/e2e/metrics/... -v -timeout=120s -count=1

test-e2e-ranking:
	cd $(ROOT) && go test ./tests/integration/e2e/ranking/... -v -timeout=120s -count=1

test-e2e-demographics:
	cd $(ROOT) && go test ./tests/integration/e2e/demographics/... -v -timeout=120s -count=1

testes unitários do bq_adapter (expandAgeRanges) — sem BigQuery real
test-unit-adapter:
	@echo "▶  Testes unitários de expandAgeRanges (sem BigQuery)..."
	cd $(ROOT) && go test ./internal/flow/repository/... \
		-run TestExpandAgeRanges \
		-v -count=1

