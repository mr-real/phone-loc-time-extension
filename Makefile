help:
	@cat Makefile

install:
	npm ci

fetch-zones:
	node scripts/fetch-zones.mjs

build:
	npm run build

test:
	npm run test

check:
	npm run check

typecheck:
	npm run typecheck

e2e:
	npm run test:e2e

clean:
	rm -rf dist src/generated

distclean:
	rm -rf dist src/generated .cache node_modules

.PHONY: help install fetch-zones build test check typecheck e2e clean distclean
