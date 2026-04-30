package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	MoralisAPIKey  string
	APIKeys        []string // keys the extension must send as X-API-Key
	AllowedOrigins []string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiKeys := splitNonEmpty(os.Getenv("API_KEYS"), ",")

	origins := splitNonEmpty(os.Getenv("ALLOWED_ORIGINS"), ",")
	if len(origins) == 0 {
		origins = []string{"*"}
	}

	return &Config{
		Port:           port,
		MoralisAPIKey:  os.Getenv("MORALIS_API_KEY"),
		APIKeys:        apiKeys,
		AllowedOrigins: origins,
	}
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
