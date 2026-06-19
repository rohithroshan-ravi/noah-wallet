package provider

import (
	"context"
	"errors"

	"github.com/rohithroshan-ravi/noah-wallet/server/internal/domain"
)

// ErrRateLimit is returned when a provider rejects the request with HTTP 429.
// The failover layer catches this and switches to the next registered provider.
var ErrRateLimit = errors.New("provider: rate limit exceeded")

// ErrNotSupported is returned when a provider does not implement a method.
// The failover layer will skip this provider and try the next one.
var ErrNotSupported = errors.New("provider: method not supported")

// BlockchainProvider is the common contract every EVM data adapter must satisfy.
// Use NewFailover to compose multiple implementations with automatic rate-limit
// switching — callers always see a single BlockchainProvider.
type BlockchainProvider interface {
	// Name returns a short identifier used in logging and rate-limit tracking.
	Name() string

	GetNativeBalance(ctx context.Context, address, chain string) (*domain.NativeBalance, error)
	GetTokenBalances(ctx context.Context, address, chain string) ([]domain.Token, error)
	GetNFTs(ctx context.Context, address, chain string) ([]domain.NFT, error)
	GetWalletHistory(ctx context.Context, address, chain string) ([]domain.HistoryEntry, error)
	GetTransactions(ctx context.Context, address, chain string) ([]domain.Transaction, error)
	GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error)
	GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error)
	GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error)
	GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error)
	ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error)
	GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error)
}
