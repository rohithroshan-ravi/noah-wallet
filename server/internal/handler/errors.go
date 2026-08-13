package handler

import (
	"errors"

	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/provider"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

// serviceError maps provider-layer errors to the correct HTTP response.
// It is the single place where provider-layer sentinel errors are translated
// so that every handler handles them consistently without duplicating logic,
// and so that GoldRush/Moralis/Ankr-specific error details (status codes,
// response bodies, endpoint names) never reach API consumers — only our own
// stable error codes do.
func serviceError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, provider.ErrRateLimit):
		return response.ServiceUnavailable(c, response.CodeRateLimited,
			"all data providers are temporarily rate-limited — please retry shortly")
	case errors.Is(err, provider.ErrNotSupported):
		return response.ServiceUnavailable(c, response.CodeNotSupported,
			"this feature is not available from any configured provider")
	case errors.Is(err, provider.ErrMissingAPIKey), errors.Is(err, provider.ErrAuthFailed):
		return response.ServiceUnavailable(c, response.CodeProviderUnavailable,
			"a data provider is misconfigured — please retry shortly")
	case errors.Is(err, provider.ErrUnavailable):
		return response.ServiceUnavailable(c, response.CodeProviderUnavailable,
			"all data providers are temporarily unavailable — please retry shortly")
	case errors.Is(err, provider.ErrTimeout):
		return response.GatewayTimeout(c, response.CodeUpstreamTimeout,
			"data providers took too long to respond — please retry shortly")
	case errors.Is(err, provider.ErrInvalidResponse):
		return response.BadGateway(c, response.CodeUpstreamInvalid,
			"received an unexpected response from a data provider")
	}
	return response.InternalError(c, err.Error())
}
