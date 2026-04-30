package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// APIKeyAuth returns a middleware that validates the X-API-Key header
// against a whitelist of keys. If keys is empty, all requests pass through.
func APIKeyAuth(keys []string) echo.MiddlewareFunc {
	if len(keys) == 0 {
		return func(next echo.HandlerFunc) echo.HandlerFunc {
			return next
		}
	}

	allowed := make(map[string]struct{}, len(keys))
	for _, k := range keys {
		if k != "" {
			allowed[k] = struct{}{}
		}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			key := c.Request().Header.Get("X-API-Key")
			if key == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing X-API-Key header")
			}
			if _, ok := allowed[key]; !ok {
				return echo.NewHTTPError(http.StatusForbidden, "invalid API key")
			}
			return next(c)
		}
	}
}
