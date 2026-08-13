package handler

import (
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/ethutil"
	"github.com/rohithroshan-ravi/noah-wallet/server/pkg/response"
)

// Default/maximum page sizes for paginated list endpoints (transactions,
// token transfers). Requests are clamped into this range rather than fetching
// an unbounded number of items into memory.
const (
	defaultPageSize = 25
	maxPageSize     = 100
)

// PortfolioHandler handles all portfolio-related routes.
type PortfolioHandler struct {
	uc usecase.PortfolioUsecase
}

func NewPortfolioHandler(uc usecase.PortfolioUsecase) *PortfolioHandler {
	return &PortfolioHandler{uc: uc}
}

// ── helpers ──────────────────────────────────────────────────────────────────

// parseParams validates the address path param and the optional "chain"
// query param, returning the *canonical* chain identifier — domain.ParseChain
// is the single place chain identifiers are validated and normalized (e.g.
// a hex chain ID and its slug alias resolve to the same string here), so
// every downstream layer can trust chain is already well-formed.
func (h *PortfolioHandler) parseParams(c echo.Context) (address, chain string, ok bool) {
	address = c.Param("address")
	if !ethutil.ValidAddress(address) {
		_ = response.BadRequest(c, response.CodeInvalidAddress, "invalid Ethereum address")
		return "", "", false
	}
	raw := c.QueryParam("chain")
	if raw == "" {
		raw = string(domain.ChainEthereum)
	}
	parsed, err := domain.ParseChain(raw)
	if err != nil {
		_ = response.BadRequest(c, response.CodeInvalidChain, "unsupported chain identifier")
		return "", "", false
	}
	return address, string(parsed), true
}

func (h *PortfolioHandler) parseDays(c echo.Context) int {
	d, err := strconv.Atoi(c.QueryParam("days"))
	if err != nil || d < 0 {
		return 0
	}
	return d
}

// parsePagination reads the "page"/"pageSize" query params (both optional,
// zero-indexed page), clamping into [0, maxPageSize] so a client can never
// force an unbounded fetch.
func (h *PortfolioHandler) parsePagination(c echo.Context) domain.Pagination {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("pageSize"))
	return domain.Pagination{Page: page, PageSize: pageSize}.Normalize(defaultPageSize, maxPageSize)
}

func toPageMeta(pi domain.PageInfo) response.PageMeta {
	return response.PageMeta{Page: pi.Page, PageSize: pi.PageSize, HasMore: pi.HasMore}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// GetNativeBalance GET /api/v1/wallets/:address/balance
func (h *PortfolioHandler) GetNativeBalance(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetNativeBalance(c.Request().Context(), addr, chain)
	if err != nil {
		return serviceError(c, err)
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
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}

// GetNFTs GET /api/v1/wallets/:address/nfts
func (h *PortfolioHandler) GetNFTs(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetNFTs(c.Request().Context(), addr, chain)
	if err != nil {
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}

// GetWalletHistory GET /api/v1/wallets/:address/history
func (h *PortfolioHandler) GetWalletHistory(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetWalletHistory(c.Request().Context(), addr, chain)
	if err != nil {
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}

// GetTransactions GET /api/v1/wallets/:address/transactions?page=&pageSize=
func (h *PortfolioHandler) GetTransactions(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	result, err := h.uc.GetTransactions(c.Request().Context(), addr, chain, h.parsePagination(c))
	if err != nil {
		return serviceError(c, err)
	}
	return response.OKPage(c, result.Items, len(result.Items), toPageMeta(result.Page))
}

// GetTokenTransfers GET /api/v1/wallets/:address/transfers?page=&pageSize=
func (h *PortfolioHandler) GetTokenTransfers(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	result, err := h.uc.GetTokenTransfers(c.Request().Context(), addr, chain, h.parsePagination(c))
	if err != nil {
		return serviceError(c, err)
	}
	return response.OKPage(c, result.Items, len(result.Items), toPageMeta(result.Page))
}

// GetDeFiPositions GET /api/v1/wallets/:address/defi
func (h *PortfolioHandler) GetDeFiPositions(c echo.Context) error {
	addr, chain, ok := h.parseParams(c)
	if !ok {
		return nil
	}
	data, err := h.uc.GetDeFiPositions(c.Request().Context(), addr, chain)
	if err != nil {
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}

// GetNetWorth GET /api/v1/wallets/:address/net-worth
// Accepts chains[] query param; defaults to ["eth"].
func (h *PortfolioHandler) GetNetWorth(c echo.Context) error {
	address := c.Param("address")
	if !ethutil.ValidAddress(address) {
		return response.BadRequest(c, response.CodeInvalidAddress, "invalid Ethereum address")
	}
	rawChains := c.QueryParams()["chains[]"]
	if len(rawChains) == 0 {
		rawChains = strings.Split(c.QueryParam("chains"), ",")
	}
	var chains []string
	for _, ch := range rawChains {
		ch = strings.TrimSpace(ch)
		if ch == "" {
			continue
		}
		parsed, err := domain.ParseChain(ch)
		if err != nil {
			return response.BadRequest(c, response.CodeInvalidChain, "unsupported chain: "+ch)
		}
		chains = append(chains, string(parsed))
	}
	if len(chains) == 0 {
		chains = []string{string(domain.ChainEthereum)}
	}
	data, err := h.uc.GetNetWorth(c.Request().Context(), address, chains)
	if err != nil {
		return serviceError(c, err)
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
		return serviceError(c, err)
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
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}

// ResolveENS GET /api/v1/wallets/:address/ens
func (h *PortfolioHandler) ResolveENS(c echo.Context) error {
	address := c.Param("address")
	if !ethutil.ValidAddress(address) {
		return response.BadRequest(c, response.CodeInvalidAddress, "invalid Ethereum address")
	}
	data, err := h.uc.ResolveENS(c.Request().Context(), address)
	if err != nil {
		return serviceError(c, err)
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
		return serviceError(c, err)
	}
	return response.OKList(c, data, len(data))
}
