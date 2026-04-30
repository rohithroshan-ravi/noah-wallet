package handler

import (
	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

type WalletHandler struct {
	usecase domain.WalletUsecase
}

func NewWalletHandler(uc domain.WalletUsecase) *WalletHandler {
	return &WalletHandler{usecase: uc}
}

func (h *WalletHandler) GetWallet(c echo.Context) error {
	address := c.Param("address")
	wallet, err := h.usecase.GetWallet(c.Request().Context(), address)
	if err != nil {
		return response.NotFound(c, err.Error())
	}
	return response.OK(c, wallet)
}

func (h *WalletHandler) CreateWallet(c echo.Context) error {
	var wallet domain.Wallet
	if err := c.Bind(&wallet); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if wallet.Address == "" || wallet.Network == "" {
		return response.BadRequest(c, "address and network are required")
	}
	if err := h.usecase.CreateWallet(c.Request().Context(), &wallet); err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.Created(c, wallet)
}
