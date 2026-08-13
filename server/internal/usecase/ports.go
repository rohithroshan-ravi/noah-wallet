package usecase

import (
	"context"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// WalletRepository is the outbound port for wallet lookups.
type WalletRepository interface {
	FindByAddress(ctx context.Context, address string) (*domain.Wallet, error)
}

// LifiService is the outbound port for all LI.FI swap/bridge API calls.
type LifiService interface {
	GetChains(ctx context.Context) ([]domain.LifiChain, error)
	GetTokens(ctx context.Context, chainID int) ([]domain.LifiToken, error)
	GetQuote(ctx context.Context, params domain.LifiQuoteParams) (*domain.LifiQuote, error)
}

// BlockchainDataService is the outbound port for EVM blockchain data.
// The concrete implementation is selected at startup and may be a multi-provider
// failover that automatically switches on rate limits.
type BlockchainDataService interface {
	GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error)
	GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error)
	GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error)
	GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error)
	GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error)
	GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error)
	GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error)
	GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error)
	GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error)
	GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error)
	ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error)
	GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error)
}
