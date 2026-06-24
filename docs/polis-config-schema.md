# `.polis.config` — fleet deployment topology (schema)

The canonical, deterministic source of truth for **per-host deployment parameters**. It exists so
`toolkit/deploy.py` resolves _who_ and _where_ to deploy without per-host tribal knowledge or
`--user`/`--host` defaulting to the current shell user (the failure that made `upmav` look
"unreachable" when the real fault was a wrong SSH user, `lex` vs `lcaraccioli`).

- **Format:** JSON (zero-dep read in both Python `json` and JS — `koine` is Python+JS).
- **Location:** repo root, `.polis.config`.
- **Tracking:** the real `.polis.config` is **gitignored** (carries env-specific SSH usernames); a
  placeholder **`.polis.config.example`** is committed as the template. Copy it and fill in real hosts.

## Shape

```json
{
  "schema": 1,
  "reader": "strong-llm-lean",
  "fleet": { "hosts": ["fire", "forge", "..."], "exclude": ["upgoose"] },
  "host": {
    "fire":  { "local": true },
    "forge": { "user": "lex" },
    "upmav": { "user": "lcaraccioli", "hostname": "upmav.lan", "home": "~/.claude" }
  }
}
```

## Fields

| Key                    | Type     | Req  | Meaning                                                                                                |
| ---------------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------ |
| `schema`               | int      | yes  | Schema version. Current: `1`. A consumer that doesn't recognize the version **errors**, never guesses. |
| `reader`               | string   | no   | Default projection profile passed downstream (e.g. `strong-llm-lean`).                                 |
| `fleet.hosts`          | string[] | yes  | The full fleet — every host key here must have a `host.<name>` entry.                                  |
| `fleet.exclude`        | string[] | no   | Hosts `--fleet` skips by default (e.g. an intentionally-held host). Default `[]`.                      |
| `host.<name>`          | object   | yes  | One per fleet host. `<name>` is the key referenced by `--host` and `fleet.hosts`.                      |
| `host.<name>.local`    | bool     | no   | `true` ⇒ deploy in-place (no SSH). At most one host should be `local`. Default `false`.                |
| `host.<name>.user`     | string   | cond | SSH user. **Required unless `local: true`.** No default-to-current-user.                               |
| `host.<name>.hostname` | string   | no   | SSH target when it differs from `<name>` (alias / FQDN / `.lan`). Default: `<name>`.                   |
| `host.<name>.home`     | string   | no   | Remote `.claude` parent. Default: omit (`deploy.py` defaults to `~/.claude`, expanded server-side).    |

## Resolution precedence (consumer contract)

For any parameter, the consumer resolves in this order — **first present wins**:

1. **CLI flag** (`--user`, `--home`, `--host`) — an explicit override always trumps config.
2. **`.polis.config` `host.<name>`** — the deterministic per-host value.
3. **Built-in default** — only where the table above names one (`hostname`→key, `home`→`~/.claude`,
   `local`→`false`). **`user` has no default** — a non-local host lacking `user` is an error.

## Validation rules (degrade-visibly / no-permissive-defaults)

A conforming consumer **hard-errors** (never silently proceeds) when:

- `--host X` names a host absent from `host.{}` — _the upmav-class failure; no silent current-user fallback._
- a `fleet.hosts` entry has no matching `host.<name>` object (or vice-versa — drift).
- a non-`local` host omits `user`.
- `schema` is missing or an unrecognized version.
- the file is present but malformed JSON. (Absent file ⇒ legacy flag-only mode; a missing config is not
  itself an error, but once present it is authoritative.)

## `--fleet` mode

`deploy.py --fleet --kind agent` iterates `fleet.hosts` minus `fleet.exclude`, deploying each host with
its resolved params, and reports a per-host result (landed / unreachable-deferred / failed). One
deterministic command replaces the hand-typed per-host loop. `--exclude <h>` may add to the config's
`exclude` for a single run; `--only <h,...>` restricts to a subset.

---

_Schema owned by nico (curate). The `deploy.py` consumer that enforces this contract is toolkit/Mav._
