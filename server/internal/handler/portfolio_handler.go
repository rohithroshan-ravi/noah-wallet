package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/ethutil"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

// PortfolioHandler handles all portfolio-related routes.
type PortfolioHandler struct {
	uc domain.PortfolioUsecase
}

// NewPortfolioHandler creates a PortfolioHandler.
func NewPortfolioHandler(uc domain.PortfolioUsecase) *PortfolioHandler {
	return &PortfolioHandler{uc: uc}
}

// ── helpers ──────────────────────────────────────────────────────────────────

func (h *PortfolioHandler) parseParams(c echo.Context) (address, chain string, ok bool) {
	address = c.Param("address")
	if !ethutil.ValidAddress(address) {
		_ = response.BadRequest(c, "invalid Ethereum address")
		return "", "", false
	}
	chain = c.QueryParam("chain")
	if chain == "" {
		chain = "eth"
	}
	if !ethutil.ValidChain(chain) {
		_ = response.BadRequest(c, "unsupported chain identifier")
		return "", "", false
	}
	return address, chain, true
}

func (h *PortfolioHandler) parseDays(c echo.Context) int {
	s := c.QueryParam("days")
	if s == "" {
		return 0
	}
	d, err := strconv.Atoi(s)
	if err != nil || d < 0 {
		return 0
	}
	return d
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// GetNativeBalance GET /api/v1/wallets/:address/balance
func (h *PortfolioHandler) GetNativeBalance(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetNativeBalance(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetTokenBalances GET /api/v1/wallets/:address/tokens
func (h *PortfolioHandler) GetTokenBalances(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetTokenBalances(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetNFTs GET /api/v1/wallets/:address/nfts
func (h *PortfolioHandler) GetNFTs(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetNFTs(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetWalletHistory GET /api/v1/wallets/:address/history
func (h *PortfolioHandler) GetWalletHistory(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetWalletHistory(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetTransactions GET /api/v1/wallets/:address/transactions
func (h *PortfolioHandler) GetTransactions(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetTransactions(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetDeFiPositions GET /api/v1/wallets/:address/defi
func (h *PortfolioHandler) GetDeFiPositions(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetDeFiPositions(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetNetWorth GET /api/v1/wallets/:address/net-worth
// Accepts chains[] query param; defaults to ["eth"].
func (h *PortfolioHandler) GetNetWorth(c echo.Context) error {
	address := c.Param("address")
	if !ethutil.ValidAddress(address) {
		return response.BadRequest(c, "invalid Ethereum address")
	}
	rawChains := c.QueryParams()["chains[]"]
	if len(rawChains) == 0 {
		rawChains = strings.Split(c.QueryParam("chains"), ",")
	}
	// Filter empties and validate
	var chains []string
	for _, ch := range rawChains {
		ch = strings.TrimSpace(ch)
		if ch == "" {
			continue
		}
		if !ethutil.ValidChain(ch) {
			return response.BadRequest(c, "unsupported chain: "+ch)
		}
		chains = append(chains, ch)
	}
	if len(chains) == 0 {
		chains = []string{"eth"}
	}
	data, err := h.uc.GetNetWorth(c.Request().Context(), address, chains)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetPnLSummary GET /api/v1/wallets/:address/pnl
func (h *PortfolioHandler) GetPnLSummary(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetPnLSummary(c.Request().Context(), addr, chain, h.parseDays(c))
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetPnLBreakdown GET /api/v1/wallets/:address/pnl/breakdown
func (h *PortfolioHandler) GetPnLBreakdown(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetPnLBreakdown(c.Request().Context(), addr, chain, h.parseDays(c))
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// ResolveENS GET /api/v1/wallets/:address/ens
func (h *PortfolioHandler) ResolveENS(c echo.Context) error {
	address := c.Param("address")
	if !ethutil.ValidAddress(address) {
		return response.BadRequest(c, "invalid Ethereum address")
	}
	data, err := h.uc.ResolveENS(c.Request().Context(), address)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// GetApprovals GET /api/v1/wallets/:address/approvals
func (h *PortfolioHandler) GetApprovals(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetApprovals(c.Request().Context(), addr, chain)
	if err != nil {
		return response.InternalError(c, err.Error())
	}
	return response.OK(c, data)
}

// ensure interface satisfied at compile time
var _ http.Handler
