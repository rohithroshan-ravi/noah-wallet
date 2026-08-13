package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	MoralisAPIKey  string
	CovalentAPIKey string // GoldRush API key (goldrush.dev) — fallback provider
	AnkrAPIKey     string // Ankr Advanced API key — second fallback (empty = public endpoint)
	APIKeys        []string
	AllowedOrigins []string
}

func Load() *Config {
	// Best-effort: load server/.env into the process environment if one
	// exists (local dev). In production, real env vars are injected by the
	// platform/secret manager and there is no .env file, so a missing file
	// here is expected and silently ignored — godotenv.Load only returns an
	// error worth logging when a .env file exists but is malformed.
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Printf("config: found .env but failed to load it: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiKeys := splitNonEmpty(os.Getenv("API_KEYS"), ",")

	origins := splitNonEmpty(os.Getenv("ALLOWED_ORIGINS"), ",")
	if len(origins) == 0 {
		origins = []string{"*"}
	}

	cfg := &Config{
		Port:           port,
		MoralisAPIKey:  os.Getenv("MORALIS_API_KEY"),
		CovalentAPIKey: os.Getenv("COVALENT_API_KEY"),
		AnkrAPIKey:     os.Getenv("ANKR_API_KEY"),
		APIKeys:        apiKeys,
		AllowedOrigins: origins,
	}

	// Fail loudly at startup rather than letting every wallet-data request
	// silently 503 with no obvious cause — this exact scenario (an .env with
	// real keys that never got loaded) is easy to hit locally.
	if cfg.MoralisAPIKey == "" && cfg.CovalentAPIKey == "" {
		log.Printf("config: WARNING — MORALIS_API_KEY and COVALENT_API_KEY are both unset; " +
			"only Ankr's rate-limited public endpoint will be tried, and every request will fail if it also lacks a key or is unavailable")
	}

	return cfg
}

func splitNonEmpty(s, sep string) []string {
	var out []string
	for _, v := range strings.Split(s, sep) {
		if v = strings.TrimSpace(v); v != "" {
			out = append(out, v)
		}
	}
	return out
}
