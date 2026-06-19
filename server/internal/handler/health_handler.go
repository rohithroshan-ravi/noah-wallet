package handler

import (
	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

func HealthCheck(c echo.Context) error {
	return response.OK(c, map[string]string{"status": "ok"})
}
