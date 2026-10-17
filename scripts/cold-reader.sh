#!/usr/bin/env sh

d=/tmp/cratylus/namer-$(date +%Y%m%dT%H%M%S%z) && mkdir -p "$d" && cp -r /tmp/cratylus/raw/.omp "$d"/ && cd "$d" && NULL_PROMPT=true omp --model anthropic/claude-opus-5-5 --thinking max --no-tools --no-extensions --no-skills --no-rules --no-lsp --no-title