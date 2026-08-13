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

// ErrMissingAPIKey is returned when a provider is called without the API key
// it requires. Returned immediately, without making an HTTP request, so a
// misconfigured provider fails fast and the failover layer can move on.
var ErrMissingAPIKey = errors.New("provider: missing api key")

// ErrAuthFailed is returned when a provider rejects the request with HTTP
// 401/403 (an invalid or revoked API key). The failover layer treats this the
// same as ErrRateLimit: cool the provider down and try the next one.
var ErrAuthFailed = errors.New("provider: authentication failed")

// ErrUnavailable is returned when a provider's upstream API returns a 5xx
// error. Treated as transient by the failover layer.
var ErrUnavailable = errors.New("provider: upstream unavailable")

// ErrTimeout is returned when a request is canceled or exceeds its deadline.
var ErrTimeout = errors.New("provider: request timed out")

// ErrInvalidResponse is returned when a provider's response cannot be parsed
// as the expected shape (malformed or unexpected JSON).
var ErrInvalidResponse = errors.New("provider: invalid response from upstream")

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
	// GetTransactions returns one page of raw on-chain transactions.
	// TransactionPage.Page.HasMore indicates whether a further call with
	// page.Page+1 is worthwhile; not every provider can honor the requested
	// page.Page precisely (see each implementation's doc comment).
	GetTransactions(ctx context.Context, address, chain string, page domain.Pagination) (domain.TransactionPage, error)
	// GetTokenTransfers returns one page of decoded ERC-20 transfer events.
	GetTokenTransfers(ctx context.Context, address, chain string, page domain.Pagination) (domain.TokenTransferPage, error)
	GetDeFiPositions(ctx context.Context, address, chain string) ([]domain.DeFiPosition, error)
	GetNetWorth(ctx context.Context, address string, chains []string) (*domain.NetWorth, error)
	GetPnLSummary(ctx context.Context, address, chain string, days int) (*domain.PnLSummary, error)
	GetPnLBreakdown(ctx context.Context, address, chain string, days int) ([]domain.TokenPnL, error)
	ResolveENS(ctx context.Context, address string) (*domain.ENSInfo, error)
	GetApprovals(ctx context.Context, address, chain string) ([]domain.Approval, error)
}
