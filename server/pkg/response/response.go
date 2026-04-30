package response

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func OK(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, Response{Success: true, Data: data})
}

func Created(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusCreated, Response{Success: true, Data: data})
}

func BadRequest(c echo.Context, err string) error {
	return c.JSON(http.StatusBadRequest, Response{Success: false, Error: err})
}

func NotFound(c echo.Context, err string) error {
	return c.JSON(http.StatusNotFound, Response{Success: false, Error: err})
}

func InternalError(c echo.Context, err string) error {
	return c.JSON(http.StatusInternalServerError, Response{Success: false, Error: err})
}
