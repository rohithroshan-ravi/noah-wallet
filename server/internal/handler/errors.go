package handler

import (
	"errors"

	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

// serviceError maps provider-layer errors to the correct HTTP response.
// It is the single place where ErrRateLimit and ErrNotSupported are translated
// so that every handler handles them consistently without duplicating logic.
func serviceError(c echo.Context, err error) error {
	if errors.Is(err, provider.ErrRateLimit) {
		return response.ServiceUnavailable(c, response.CodeRateLimited,
			"all data providers are temporarily rate-limited — please retry shortly")
	}
	if errors.Is(err, provider.ErrNotSupported) {
		return response.ServiceUnavailable(c, response.CodeNotSupported,
			"this feature is not available from any configured provider")
	}
	return response.InternalError(c, err.Error())
}
