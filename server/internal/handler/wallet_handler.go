package handler

import (
	"errors"

	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

type WalletHandler struct {
	usecase usecase.WalletUsecase
}

func NewWalletHandler(uc usecase.WalletUsecase) *WalletHandler {
	return &WalletHandler{usecase: uc}
}

func (h *WalletHandler) GetWallet(c echo.Context) error {
	address := c.Param("address")
	wallet, err := h.usecase.GetWallet(c.Request().Context(), address)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return response.NotFound(c, "wallet not found")
		}
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, wallet)
}

