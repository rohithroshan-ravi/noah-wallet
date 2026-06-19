// Package response provides a unified JSON envelope for all API endpoints.
//
// Every response, success or error, has the same top-level shape:
//
//	{
//	  "success":   true | false,
//	  "data":      <payload> | null,
//	  "error":     null | { "code": "...", "message": "..." },
//	  "meta":      { "timestamp": "...", "requestId": "...", "count": N }
//	}
package response

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// ── Error codes ───────────────────────────────────────────────────────────────

const (
	CodeInvalidAddress = "INVALID_ADDRESS"
	CodeInvalidChain   = "INVALID_CHAIN"
	CodeInvalidParam   = "INVALID_PARAM"
	CodeNotFound       = "NOT_FOUND"
	CodeRateLimited    = "RATE_LIMITED"
	CodeNotSupported   = "NOT_SUPPORTED"
	CodeInternalError  = "INTERNAL_ERROR"
)

// ── Envelope types ────────────────────────────────────────────────────────────

// Meta holds request-scoped metadata present on every response.
type Meta struct {
	Timestamp string `json:"timestamp"`
	RequestID string `json:"requestId,omitempty"`
	Count     *int   `json:"count,omitempty"` // only set on list responses
}

// APIError carries machine-readable error information.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Response is the JSON envelope sent for every endpoint.
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   *APIError   `json:"error"`
	Meta    Meta        `json:"meta"`
}

// ── helpers ───────────────────────────────────────────────────────────────────

func meta(c echo.Context) Meta {
	return Meta{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		RequestID: c.Response().Header().Get(echo.HeaderXRequestID),
	}
}

func metaWithCount(c echo.Context, n int) Meta {
	m := meta(c)
	m.Count = &n
	return m
}

// ── Success responses ─────────────────────────────────────────────────────────

// OK sends HTTP 200 with the given data payload.
func OK(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
		Error:   nil,
		Meta:    meta(c),
	})
}

// OKList sends HTTP 200 with a list payload.  count is written into meta so
// callers can read the total without inspecting the array.
func OKList(c echo.Context, data interface{}, count int) error {
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    data,
		Error:   nil,
		Meta:    metaWithCount(c, count),
	})
}

// Created sends HTTP 201 with the created resource.
func Created(c echo.Context, data interface{}) error {
	return c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    data,
		Error:   nil,
		Meta:    meta(c),
	})
}

// ── Error responses ───────────────────────────────────────────────────────────

func errResp(c echo.Context, status int, code, message string) error {
	return c.JSON(status, Response{
		Success: false,
		Data:    nil,
		Error:   &APIError{Code: code, Message: message},
		Meta:    meta(c),
	})
}

// BadRequest sends HTTP 400.  code should be one of the Code* constants.
func BadRequest(c echo.Context, code, message string) error {
	return errResp(c, http.StatusBadRequest, code, message)
}

// NotFound sends HTTP 404.
func NotFound(c echo.Context, message string) error {
	return errResp(c, http.StatusNotFound, CodeNotFound, message)
}

// ServiceUnavailable sends HTTP 503 (e.g. all providers rate-limited).
func ServiceUnavailable(c echo.Context, code, message string) error {
	return errResp(c, http.StatusServiceUnavailable, code, message)
}

// InternalError sends HTTP 500.
func InternalError(c echo.Context, message string) error {
	return errResp(c, http.StatusInternalServerError, CodeInternalError, message)
}
