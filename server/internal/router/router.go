package router

import (
	"github.com/labstack/echo/v4"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/handler"
	appmw "github.com/rohithroshan-ravi/noah-wallet/server/internal/middleware"
	"github.com/rohithroshan-ravi/noah-wallet/server/internal/usecase"
)

// Register wires all routes onto e.
func Register(e *echo.Echo, walletUC usecase.WalletUsecase, portfolioUC usecase.PortfolioUsecase, swapUC usecase.SwapUsecase, apiKeys []string) {
	wh := handler.NewWalletHandler(walletUC)
	ph := handler.NewPortfolioHandler(portfolioUC)
	sh := handler.NewSwapHandler(swapUC)

	e.GET("/health", handler.HealthCheck)

	api := e.Group("/api/v1",
		appmw.SecurityHeaders(),
		appmw.APIKeyAuth(apiKeys),
	)

	// Wallet CRUD
	api.GET("/wallets/:address", wh.GetWallet)

	// Asset Holdings
	api.GET("/wallets/:address/balance", ph.GetNativeBalance)
	api.GET("/wallets/:address/tokens", ph.GetTokenBalances)
	api.GET("/wallets/:address/nfts", ph.GetNFTs)

	// Transaction History
	api.GET("/wallets/:address/history", ph.GetWalletHistory)
	api.GET("/wallets/:address/transactions", ph.GetTransactions)

	// DeFi Positions
	api.GET("/wallets/:address/defi", ph.GetDeFiPositions)

	// Financial Metrics
	api.GET("/wallets/:address/net-worth", ph.GetNetWorth)
	api.GET("/wallets/:address/pnl", ph.GetPnLSummary)
	api.GET("/wallets/:address/pnl/breakdown", ph.GetPnLBreakdown)

	// Identity
	api.GET("/wallets/:address/ens", ph.ResolveENS)

	// Approvals
	api.GET("/wallets/:address/approvals", ph.GetApprovals)

	// Swap (LI.FI)
	api.GET("/swap/chains", sh.GetChains)
	api.GET("/swap/tokens", sh.GetTokens)
	api.GET("/swap/quote", sh.GetQuote)
}
