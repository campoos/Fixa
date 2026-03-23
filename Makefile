.PHONY: doctor bootstrap check dev

doctor:
	@bash scripts/doctor.sh

bootstrap:
	@bash scripts/bootstrap.sh

check:
	@bash scripts/check.sh

dev:
	@bash scripts/dev.sh

dev-prod:
	@bash scripts/dev.sh --profile prod
