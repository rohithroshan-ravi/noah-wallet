package handler

import (
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

// SwapHandler handles LI.FI swap/bridge routes.
type SwapHandler struct {
	uc usecase.SwapUsecase
}

func NewSwapHandler(uc usecase.SwapUsecase) *SwapHandler {
	return &SwapHandler{uc: uc}
}

// GetChains GET /api/v1/swap/chains
func (h *SwapHandler) GetChains(c echo.Context) error {
	data, err := h.uc.GetChains(c.Request().Context())
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetTokens GET /api/v1/swap/tokens?chainId=1
func (h *SwapHandler) GetTokens(c echo.Context) error {
	raw := c.QueryParam("chainId")
	if raw == "" {
		return response.BadRequest(c, "chainId is required")
	}
	chainID, err := strconv.Atoi(raw)
	if err != nil || chainID <= 0 {
		return response.BadRequest(c, "invalid chainId")
	}
	data, err := h.uc.GetTokens(c.Request().Context(), chainID)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetQuote GET /api/v1/swap/quote
func (h *SwapHandler) GetQuote(c echo.Context) error {
	fromChain, err := strconv.Atoi(c.QueryParam("fromChain"))
	if err != nil || fromChain <= 0 {
		return response.BadRequest(c, "invalid fromChain")
	}
	toChain, err := strconv.Atoi(c.QueryParam("toChain"))
	if err != nil || toChain <= 0 {
		return response.BadRequest(c, "invalid toChain")
	}
	fromToken := c.QueryParam("fromToken")
	if fromToken == "" {
		return response.BadRequest(c, "fromToken is required")
	}
	toToken := c.QueryParam("toToken")
	if toToken == "" {
		return response.BadRequest(c, "toToken is required")
	}
	fromAmount := c.QueryParam("fromAmount")
	if fromAmount == "" {
		return response.BadRequest(c, "fromAmount is required")
	}
	fromAddress := c.QueryParam("fromAddress")
	if fromAddress == "" {
		return response.BadRequest(c, "fromAddress is required")
	}

	var slippage float64
	if s := c.QueryParam("slippage"); s != "" {
		slippage, _ = strconv.ParseFloat(s, 64)
	}

	params := domain.LifiQuoteParams{
		FromChain:   fromChain,
		ToChain:     toChain,
		FromToken:   fromToken,
		ToToken:     toToken,
		FromAmount:  fromAmount,
		FromAddress: fromAddress,
		Slippage:    slippage,
	}

	data, err := h.uc.GetQuote(c.Request().Context(), params)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}
